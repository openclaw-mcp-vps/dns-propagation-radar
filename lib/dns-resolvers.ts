export type DnsResolver = {
  id: string;
  name: string;
  ip: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
};

export const DNS_RESOLVERS: DnsResolver[] = [
  { id: "google-us", name: "Google", ip: "8.8.8.8", region: "North America", country: "US", latitude: 37.7749, longitude: -122.4194 },
  { id: "google-us-2", name: "Google", ip: "8.8.4.4", region: "North America", country: "US", latitude: 40.7128, longitude: -74.006 },
  { id: "cloudflare-global", name: "Cloudflare", ip: "1.1.1.1", region: "Global", country: "US", latitude: 33.4484, longitude: -112.074 },
  { id: "cloudflare-global-2", name: "Cloudflare", ip: "1.0.0.1", region: "Global", country: "US", latitude: 47.6062, longitude: -122.3321 },
  { id: "quad9", name: "Quad9", ip: "9.9.9.9", region: "Global", country: "CH", latitude: 47.3769, longitude: 8.5417 },
  { id: "quad9-2", name: "Quad9", ip: "149.112.112.112", region: "Global", country: "CH", latitude: 46.2044, longitude: 6.1432 },
  { id: "opendns", name: "OpenDNS", ip: "208.67.222.222", region: "North America", country: "US", latitude: 37.3382, longitude: -121.8863 },
  { id: "opendns-2", name: "OpenDNS", ip: "208.67.220.220", region: "North America", country: "US", latitude: 34.0522, longitude: -118.2437 },
  { id: "adguard", name: "AdGuard", ip: "94.140.14.14", region: "Europe", country: "CY", latitude: 35.1856, longitude: 33.3823 },
  { id: "adguard-2", name: "AdGuard", ip: "94.140.15.15", region: "Europe", country: "CY", latitude: 34.7071, longitude: 33.0226 },
  { id: "cleanbrowsing", name: "CleanBrowsing", ip: "185.228.168.9", region: "Europe", country: "GB", latitude: 51.5072, longitude: -0.1276 },
  { id: "cleanbrowsing-2", name: "CleanBrowsing", ip: "185.228.169.9", region: "Europe", country: "GB", latitude: 53.4808, longitude: -2.2426 },
  { id: "comodo", name: "Comodo", ip: "8.26.56.26", region: "North America", country: "US", latitude: 41.8781, longitude: -87.6298 },
  { id: "comodo-2", name: "Comodo", ip: "8.20.247.20", region: "North America", country: "US", latitude: 29.7604, longitude: -95.3698 },
  { id: "yandex", name: "Yandex", ip: "77.88.8.8", region: "Europe", country: "RU", latitude: 55.7558, longitude: 37.6173 },
  { id: "yandex-2", name: "Yandex", ip: "77.88.8.1", region: "Europe", country: "RU", latitude: 59.9343, longitude: 30.3351 },
  { id: "alidns", name: "AliDNS", ip: "223.5.5.5", region: "APAC", country: "CN", latitude: 31.2304, longitude: 121.4737 },
  { id: "alidns-2", name: "AliDNS", ip: "223.6.6.6", region: "APAC", country: "CN", latitude: 39.9042, longitude: 116.4074 },
  { id: "dnspod", name: "DNSPod", ip: "119.29.29.29", region: "APAC", country: "CN", latitude: 22.5431, longitude: 114.0579 },
  { id: "dnspod-2", name: "DNSPod", ip: "182.254.116.116", region: "APAC", country: "CN", latitude: 23.1291, longitude: 113.2644 },
  { id: "iiij", name: "IIJ", ip: "202.232.2.2", region: "APAC", country: "JP", latitude: 35.6762, longitude: 139.6503 },
  { id: "iiij-2", name: "IIJ", ip: "202.232.3.3", region: "APAC", country: "JP", latitude: 34.6937, longitude: 135.5023 },
  { id: "kt", name: "KT DNS", ip: "168.126.63.1", region: "APAC", country: "KR", latitude: 37.5665, longitude: 126.978 },
  { id: "kt-2", name: "KT DNS", ip: "168.126.63.2", region: "APAC", country: "KR", latitude: 35.1796, longitude: 129.0756 },
  { id: "vodafone-in", name: "Vodafone IN", ip: "203.122.58.134", region: "APAC", country: "IN", latitude: 19.076, longitude: 72.8777 },
  { id: "vodafone-in-2", name: "Vodafone IN", ip: "203.122.58.135", region: "APAC", country: "IN", latitude: 28.6139, longitude: 77.209 },
  { id: "telefonica-es", name: "Telefonica", ip: "80.58.61.250", region: "Europe", country: "ES", latitude: 40.4168, longitude: -3.7038 },
  { id: "telefonica-es-2", name: "Telefonica", ip: "80.58.61.254", region: "Europe", country: "ES", latitude: 41.3874, longitude: 2.1686 },
  { id: "orange-fr", name: "Orange", ip: "80.10.246.2", region: "Europe", country: "FR", latitude: 48.8566, longitude: 2.3522 },
  { id: "orange-fr-2", name: "Orange", ip: "80.10.246.129", region: "Europe", country: "FR", latitude: 43.2965, longitude: 5.3698 },
  { id: "bt-uk", name: "BT", ip: "194.74.65.68", region: "Europe", country: "GB", latitude: 51.5099, longitude: -0.118 },
  { id: "bt-uk-2", name: "BT", ip: "194.72.9.38", region: "Europe", country: "GB", latitude: 55.9533, longitude: -3.1883 },
  { id: "vivo-br", name: "Vivo", ip: "200.142.130.104", region: "South America", country: "BR", latitude: -23.5505, longitude: -46.6333 },
  { id: "vivo-br-2", name: "Vivo", ip: "200.142.130.103", region: "South America", country: "BR", latitude: -22.9068, longitude: -43.1729 },
  { id: "claro-ar", name: "Claro", ip: "200.45.191.35", region: "South America", country: "AR", latitude: -34.6037, longitude: -58.3816 },
  { id: "claro-ar-2", name: "Claro", ip: "200.45.191.40", region: "South America", country: "AR", latitude: -31.4201, longitude: -64.1888 },
  { id: "telefonica-pe", name: "Movistar", ip: "200.48.225.130", region: "South America", country: "PE", latitude: -12.0464, longitude: -77.0428 },
  { id: "telefonica-pe-2", name: "Movistar", ip: "200.48.225.146", region: "South America", country: "PE", latitude: -16.409, longitude: -71.5375 },
  { id: "mtn-za", name: "MTN", ip: "196.11.240.241", region: "Africa", country: "ZA", latitude: -26.2041, longitude: 28.0473 },
  { id: "mtn-za-2", name: "MTN", ip: "196.7.0.138", region: "Africa", country: "ZA", latitude: -33.9249, longitude: 18.4241 },
  { id: "vodacom-tz", name: "Vodacom", ip: "196.46.254.34", region: "Africa", country: "TZ", latitude: -6.7924, longitude: 39.2083 },
  { id: "vodacom-tz-2", name: "Vodacom", ip: "196.46.254.35", region: "Africa", country: "TZ", latitude: -3.3869, longitude: 36.6829 }
];
