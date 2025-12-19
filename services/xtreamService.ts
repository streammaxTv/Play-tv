
import { XtreamCredentials, AuthResponse, Category, StreamItem, EpgProgram, VodInfoResponse, SeriesDetails } from '../types';

// List of reliable public CORS proxies
const FALLBACK_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/'
];

export class XtreamService {
  private credentials: XtreamCredentials;

  constructor(creds: XtreamCredentials) {
    this.credentials = creds;
  }

  private getApiUrl() {
    let dns = this.credentials.dns.trim();
    if (!dns.startsWith('http')) {
      dns = `http://${dns}`;
    }
    dns = dns.replace(/\/$/, '');
    return `${dns}/player_api.php?username=${encodeURIComponent(this.credentials.username)}&password=${encodeURIComponent(this.credentials.password)}`;
  }

  private async parseResponse(response: Response): Promise<any> {
    const data = await response.json();
    if (data && data.contents !== undefined) {
      if (typeof data.contents === 'string') {
        try {
          return JSON.parse(data.contents);
        } catch (e) {
          return null;
        }
      }
      return data.contents;
    }
    return data;
  }

  private async tryFetch(url: string, timeoutMs: number = 45000): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        mode: 'cors',
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  private async secureFetch(actionUrl: string) {
    const isHttpsPage = window.location.protocol === 'https:';
    const isHttpDns = actionUrl.includes('http:');
    const urlsToTry: string[] = [];

    if (this.credentials.proxyUrl) {
      urlsToTry.push(`${this.credentials.proxyUrl}${encodeURIComponent(actionUrl)}`);
    } else if (isHttpsPage && isHttpDns) {
      urlsToTry.push(`${FALLBACK_PROXIES[0]}${encodeURIComponent(actionUrl)}`);
    } else {
      urlsToTry.push(actionUrl);
    }

    FALLBACK_PROXIES.forEach(proxy => {
      const proxyUrl = `${proxy}${encodeURIComponent(actionUrl)}`;
      if (!urlsToTry.includes(proxyUrl)) {
        urlsToTry.push(proxyUrl);
      }
    });

    let lastError: any = null;
    for (const url of urlsToTry) {
      try {
        const response = await this.tryFetch(url);
        if (response.ok) return response;
        if (response.status === 401 || response.status === 403) return response; 
      } catch (err: any) {
        lastError = err;
      }
    }

    if (lastError?.name === 'AbortError') throw new Error('TIMEOUT');
    throw new Error('NETWORK_OR_CORS');
  }

  async authenticate(): Promise<AuthResponse> {
    const url = this.getApiUrl();
    const response = await this.secureFetch(url);
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) throw new Error('AUTH_INVALID');
      throw new Error(`SERVER_ERROR_${response.status}`);
    }
    const data = await this.parseResponse(response);
    if (!data || !data.user_info || data.user_info.auth === 0) throw new Error('AUTH_INVALID');
    return data;
  }

  async getCategories(type: 'live' | 'vod' | 'series'): Promise<Category[]> {
    const action = type === 'live' ? 'get_live_categories' : type === 'vod' ? 'get_vod_categories' : 'get_series_categories';
    const url = `${this.getApiUrl()}&action=${action}`;
    try {
      const response = await this.secureFetch(url);
      const data = await this.parseResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (err) { return []; }
  }

  async getStreams(type: 'live' | 'vod' | 'series', categoryId?: string): Promise<StreamItem[]> {
    const action = type === 'live' ? 'get_live_streams' : type === 'vod' ? 'get_vod_streams' : 'get_series';
    let url = `${this.getApiUrl()}&action=${action}`;
    if (categoryId && categoryId !== '0') url += `&category_id=${categoryId}`;
    try {
      const response = await this.secureFetch(url);
      const data = await this.parseResponse(response);
      return Array.isArray(data) ? data : [];
    } catch (err) { return []; }
  }

  async getVodInfo(vodId: number): Promise<VodInfoResponse | null> {
    const url = `${this.getApiUrl()}&action=get_vod_info&vod_id=${vodId}`;
    try {
      const response = await this.secureFetch(url);
      return await this.parseResponse(response);
    } catch (err) { return null; }
  }

  async getSeriesInfo(seriesId: number): Promise<SeriesDetails | null> {
    const url = `${this.getApiUrl()}&action=get_series_info&series_id=${seriesId}`;
    try {
      const response = await this.secureFetch(url);
      return await this.parseResponse(response);
    } catch (err) { return null; }
  }

  async getShortEpg(streamId: number): Promise<EpgProgram[]> {
    const url = `${this.getApiUrl()}&action=get_short_epg&stream_id=${streamId}`;
    try {
      const response = await this.secureFetch(url);
      const data = await this.parseResponse(response);
      return data?.epg_listings || [];
    } catch (err) { return []; }
  }

  getStreamUrl(type: 'live' | 'vod' | 'series', streamId: number, extension: string = 'ts', proxy: boolean = false): string {
    const { dns, username, password } = this.credentials;
    const cleanDns = dns.replace(/\/$/, '');
    const user = encodeURIComponent(username);
    const pass = encodeURIComponent(password);

    let url = "";
    if (type === 'live') url = `${cleanDns}/live/${user}/${pass}/${streamId}.${extension}`;
    else if (type === 'vod') url = `${cleanDns}/movie/${user}/${pass}/${streamId}.${extension}`;
    else url = `${cleanDns}/series/${user}/${pass}/${streamId}.${extension}`;

    if (proxy) {
      // Use configured proxy or fallback to the first one available
      const proxyBase = this.credentials.proxyUrl || FALLBACK_PROXIES[0];
      return `${proxyBase}${encodeURIComponent(url)}`;
    }
    return url;
  }
}
