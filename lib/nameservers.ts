export type ResolverRegion = "NA" | "SA" | "EU" | "AF" | "ME" | "AP";

export type GlobalResolver = {
  id: string;
  provider: string;
  label: string;
  ip: string;
  city: string;
  country: string;
  region: ResolverRegion;
  lat: number;
  lng: number;
};

export const GLOBAL_RESOLVERS: GlobalResolver[] = [
  { id: "google-us-1", provider: "Google", label: "Google US East", ip: "8.8.8.8", city: "Ashburn", country: "US", region: "NA", lat: 39.0438, lng: -77.4874 },
  { id: "google-us-2", provider: "Google", label: "Google US West", ip: "8.8.4.4", city: "Los Angeles", country: "US", region: "NA", lat: 34.0522, lng: -118.2437 },
  { id: "cloudflare-us", provider: "Cloudflare", label: "Cloudflare US", ip: "1.1.1.1", city: "San Jose", country: "US", region: "NA", lat: 37.3382, lng: -121.8863 },
  { id: "cloudflare-au", provider: "Cloudflare", label: "Cloudflare Sydney", ip: "1.0.0.1", city: "Sydney", country: "AU", region: "AP", lat: -33.8688, lng: 151.2093 },
  { id: "quad9-us", provider: "Quad9", label: "Quad9 New York", ip: "9.9.9.9", city: "New York", country: "US", region: "NA", lat: 40.7128, lng: -74.006 },
  { id: "quad9-eu", provider: "Quad9", label: "Quad9 Frankfurt", ip: "149.112.112.112", city: "Frankfurt", country: "DE", region: "EU", lat: 50.1109, lng: 8.6821 },
  { id: "opendns-us-1", provider: "OpenDNS", label: "OpenDNS Chicago", ip: "208.67.222.222", city: "Chicago", country: "US", region: "NA", lat: 41.8781, lng: -87.6298 },
  { id: "opendns-us-2", provider: "OpenDNS", label: "OpenDNS Dallas", ip: "208.67.220.220", city: "Dallas", country: "US", region: "NA", lat: 32.7767, lng: -96.797 },
  { id: "adguard-eu-1", provider: "AdGuard", label: "AdGuard Amsterdam", ip: "94.140.14.14", city: "Amsterdam", country: "NL", region: "EU", lat: 52.3676, lng: 4.9041 },
  { id: "adguard-eu-2", provider: "AdGuard", label: "AdGuard Warsaw", ip: "94.140.15.15", city: "Warsaw", country: "PL", region: "EU", lat: 52.2297, lng: 21.0122 },
  { id: "cleanbrowsing-us-1", provider: "CleanBrowsing", label: "CleanBrowsing Miami", ip: "185.228.168.9", city: "Miami", country: "US", region: "NA", lat: 25.7617, lng: -80.1918 },
  { id: "cleanbrowsing-us-2", provider: "CleanBrowsing", label: "CleanBrowsing Seattle", ip: "185.228.169.9", city: "Seattle", country: "US", region: "NA", lat: 47.6062, lng: -122.3321 },
  { id: "verisign-us-1", provider: "Verisign", label: "Verisign Virginia", ip: "64.6.64.6", city: "Reston", country: "US", region: "NA", lat: 38.9586, lng: -77.357 },
  { id: "verisign-us-2", provider: "Verisign", label: "Verisign California", ip: "64.6.65.6", city: "San Francisco", country: "US", region: "NA", lat: 37.7749, lng: -122.4194 },
  { id: "dnswatch-eu-1", provider: "DNS.WATCH", label: "DNS.WATCH Berlin", ip: "84.200.69.80", city: "Berlin", country: "DE", region: "EU", lat: 52.52, lng: 13.405 },
  { id: "dnswatch-eu-2", provider: "DNS.WATCH", label: "DNS.WATCH Munich", ip: "84.200.70.40", city: "Munich", country: "DE", region: "EU", lat: 48.1351, lng: 11.582 },
  { id: "yandex-eu-1", provider: "Yandex", label: "Yandex Moscow", ip: "77.88.8.8", city: "Moscow", country: "RU", region: "EU", lat: 55.7558, lng: 37.6173 },
  { id: "yandex-eu-2", provider: "Yandex", label: "Yandex St Petersburg", ip: "77.88.8.1", city: "St Petersburg", country: "RU", region: "EU", lat: 59.9311, lng: 30.3609 },
  { id: "alidns-ap-1", provider: "AliDNS", label: "AliDNS Singapore", ip: "223.5.5.5", city: "Singapore", country: "SG", region: "AP", lat: 1.3521, lng: 103.8198 },
  { id: "alidns-ap-2", provider: "AliDNS", label: "AliDNS Hong Kong", ip: "223.6.6.6", city: "Hong Kong", country: "HK", region: "AP", lat: 22.3193, lng: 114.1694 },
  { id: "baidu-ap", provider: "Baidu", label: "Baidu Beijing", ip: "180.76.76.76", city: "Beijing", country: "CN", region: "AP", lat: 39.9042, lng: 116.4074 },
  { id: "114dns-ap", provider: "114DNS", label: "114DNS Shanghai", ip: "114.114.114.114", city: "Shanghai", country: "CN", region: "AP", lat: 31.2304, lng: 121.4737 },
  { id: "onedns-ap", provider: "OneDNS", label: "OneDNS Tokyo", ip: "117.50.10.10", city: "Tokyo", country: "JP", region: "AP", lat: 35.6762, lng: 139.6503 },
  { id: "freenom-eu", provider: "Freenom", label: "Freenom London", ip: "80.80.80.80", city: "London", country: "GB", region: "EU", lat: 51.5072, lng: -0.1276 },
  { id: "he-us", provider: "Hurricane Electric", label: "Hurricane Electric Fremont", ip: "74.82.42.42", city: "Fremont", country: "US", region: "NA", lat: 37.5483, lng: -121.9886 },
  { id: "level3-us-1", provider: "Level3", label: "Level3 Denver", ip: "4.2.2.1", city: "Denver", country: "US", region: "NA", lat: 39.7392, lng: -104.9903 },
  { id: "level3-us-2", provider: "Level3", label: "Level3 Phoenix", ip: "4.2.2.2", city: "Phoenix", country: "US", region: "NA", lat: 33.4484, lng: -112.074 },
  { id: "neustar-us-1", provider: "Neustar", label: "Neustar Washington", ip: "156.154.70.1", city: "Washington", country: "US", region: "NA", lat: 38.9072, lng: -77.0369 },
  { id: "neustar-us-2", provider: "Neustar", label: "Neustar Atlanta", ip: "156.154.71.1", city: "Atlanta", country: "US", region: "NA", lat: 33.749, lng: -84.388 },
  { id: "safedns-eu-1", provider: "SafeDNS", label: "SafeDNS Kyiv", ip: "195.46.39.39", city: "Kyiv", country: "UA", region: "EU", lat: 50.4501, lng: 30.5234 },
  { id: "safedns-eu-2", provider: "SafeDNS", label: "SafeDNS Riga", ip: "195.46.39.40", city: "Riga", country: "LV", region: "EU", lat: 56.9496, lng: 24.1052 },
  { id: "opennic-af", provider: "OpenNIC", label: "OpenNIC Johannesburg", ip: "165.227.203.27", city: "Johannesburg", country: "ZA", region: "AF", lat: -26.2041, lng: 28.0473 },
  { id: "publicdns-sa-1", provider: "Public DNS", label: "Public DNS Sao Paulo", ip: "200.221.11.101", city: "Sao Paulo", country: "BR", region: "SA", lat: -23.5505, lng: -46.6333 },
  { id: "publicdns-sa-2", provider: "Public DNS", label: "Public DNS Buenos Aires", ip: "200.51.212.7", city: "Buenos Aires", country: "AR", region: "SA", lat: -34.6037, lng: -58.3816 },
  { id: "publicdns-me-1", provider: "Public DNS", label: "Public DNS Dubai", ip: "185.51.200.2", city: "Dubai", country: "AE", region: "ME", lat: 25.2048, lng: 55.2708 },
  { id: "publicdns-me-2", provider: "Public DNS", label: "Public DNS Tel Aviv", ip: "81.218.119.11", city: "Tel Aviv", country: "IL", region: "ME", lat: 32.0853, lng: 34.7818 },
  { id: "nextdns-ap-1", provider: "NextDNS", label: "NextDNS Mumbai", ip: "45.90.28.0", city: "Mumbai", country: "IN", region: "AP", lat: 19.076, lng: 72.8777 },
  { id: "nextdns-ap-2", provider: "NextDNS", label: "NextDNS Seoul", ip: "45.90.30.0", city: "Seoul", country: "KR", region: "AP", lat: 37.5665, lng: 126.978 },
  { id: "cf-br", provider: "Cloudflare", label: "Cloudflare Rio", ip: "1.1.1.2", city: "Rio de Janeiro", country: "BR", region: "SA", lat: -22.9068, lng: -43.1729 },
  { id: "cf-de", provider: "Cloudflare", label: "Cloudflare Munich", ip: "1.0.0.2", city: "Munich", country: "DE", region: "EU", lat: 48.1351, lng: 11.582 },
  { id: "google-jp", provider: "Google", label: "Google Tokyo", ip: "8.8.8.8", city: "Tokyo", country: "JP", region: "AP", lat: 35.6762, lng: 139.6503 },
  { id: "google-br", provider: "Google", label: "Google Sao Paulo", ip: "8.8.4.4", city: "Sao Paulo", country: "BR", region: "SA", lat: -23.5505, lng: -46.6333 }
];

export const TOTAL_RESOLVERS = GLOBAL_RESOLVERS.length;
