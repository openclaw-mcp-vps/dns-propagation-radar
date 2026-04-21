import { DNSResolverDefinition } from "@/lib/types";

export const DNS_RESOLVERS: DNSResolverDefinition[] = [
  {
    id: "google-primary",
    name: "Google Public DNS #1",
    provider: "Google",
    ip: "8.8.8.8",
    location: { lat: 37.7749, lng: -122.4194, region: "North America", countryCode: "US" }
  },
  {
    id: "google-secondary",
    name: "Google Public DNS #2",
    provider: "Google",
    ip: "8.8.4.4",
    location: { lat: 40.7128, lng: -74.006, region: "North America", countryCode: "US" }
  },
  {
    id: "cloudflare-primary",
    name: "Cloudflare DNS #1",
    provider: "Cloudflare",
    ip: "1.1.1.1",
    location: { lat: -33.8688, lng: 151.2093, region: "Oceania", countryCode: "AU" }
  },
  {
    id: "cloudflare-secondary",
    name: "Cloudflare DNS #2",
    provider: "Cloudflare",
    ip: "1.0.0.1",
    location: { lat: 51.5072, lng: -0.1276, region: "Europe", countryCode: "GB" }
  },
  {
    id: "quad9-primary",
    name: "Quad9 #1",
    provider: "Quad9",
    ip: "9.9.9.9",
    location: { lat: 47.3769, lng: 8.5417, region: "Europe", countryCode: "CH" }
  },
  {
    id: "quad9-secondary",
    name: "Quad9 #2",
    provider: "Quad9",
    ip: "149.112.112.112",
    location: { lat: 41.8781, lng: -87.6298, region: "North America", countryCode: "US" }
  },
  {
    id: "opendns-primary",
    name: "OpenDNS #1",
    provider: "Cisco OpenDNS",
    ip: "208.67.222.222",
    location: { lat: 37.3382, lng: -121.8863, region: "North America", countryCode: "US" }
  },
  {
    id: "opendns-secondary",
    name: "OpenDNS #2",
    provider: "Cisco OpenDNS",
    ip: "208.67.220.220",
    location: { lat: 45.5152, lng: -122.6784, region: "North America", countryCode: "US" }
  },
  {
    id: "adguard-primary",
    name: "AdGuard DNS #1",
    provider: "AdGuard",
    ip: "94.140.14.14",
    location: { lat: 35.1264, lng: 33.4299, region: "Europe", countryCode: "CY" }
  },
  {
    id: "adguard-secondary",
    name: "AdGuard DNS #2",
    provider: "AdGuard",
    ip: "94.140.15.15",
    location: { lat: 52.52, lng: 13.405, region: "Europe", countryCode: "DE" }
  },
  {
    id: "cleanbrowsing-primary",
    name: "CleanBrowsing #1",
    provider: "CleanBrowsing",
    ip: "185.228.168.9",
    location: { lat: 52.3676, lng: 4.9041, region: "Europe", countryCode: "NL" }
  },
  {
    id: "cleanbrowsing-secondary",
    name: "CleanBrowsing #2",
    provider: "CleanBrowsing",
    ip: "185.228.169.9",
    location: { lat: 48.8566, lng: 2.3522, region: "Europe", countryCode: "FR" }
  },
  {
    id: "controld-primary",
    name: "Control D #1",
    provider: "Control D",
    ip: "76.76.2.0",
    location: { lat: 43.6532, lng: -79.3832, region: "North America", countryCode: "CA" }
  },
  {
    id: "controld-secondary",
    name: "Control D #2",
    provider: "Control D",
    ip: "76.76.10.0",
    location: { lat: 49.2827, lng: -123.1207, region: "North America", countryCode: "CA" }
  },
  {
    id: "neustar-primary",
    name: "Neustar #1",
    provider: "Neustar UltraDNS",
    ip: "64.6.64.6",
    location: { lat: 39.9526, lng: -75.1652, region: "North America", countryCode: "US" }
  },
  {
    id: "neustar-secondary",
    name: "Neustar #2",
    provider: "Neustar UltraDNS",
    ip: "64.6.65.6",
    location: { lat: 33.749, lng: -84.388, region: "North America", countryCode: "US" }
  },
  {
    id: "comodo-primary",
    name: "Comodo Secure DNS #1",
    provider: "Comodo",
    ip: "8.26.56.26",
    location: { lat: 25.7617, lng: -80.1918, region: "North America", countryCode: "US" }
  },
  {
    id: "comodo-secondary",
    name: "Comodo Secure DNS #2",
    provider: "Comodo",
    ip: "8.20.247.20",
    location: { lat: 32.7767, lng: -96.797, region: "North America", countryCode: "US" }
  },
  {
    id: "level3-1",
    name: "Level3 #1",
    provider: "Level3",
    ip: "4.2.2.1",
    location: { lat: 42.3601, lng: -71.0589, region: "North America", countryCode: "US" }
  },
  {
    id: "level3-2",
    name: "Level3 #2",
    provider: "Level3",
    ip: "4.2.2.2",
    location: { lat: 39.7392, lng: -104.9903, region: "North America", countryCode: "US" }
  },
  {
    id: "level3-3",
    name: "Level3 #3",
    provider: "Level3",
    ip: "4.2.2.3",
    location: { lat: 29.7604, lng: -95.3698, region: "North America", countryCode: "US" }
  },
  {
    id: "level3-4",
    name: "Level3 #4",
    provider: "Level3",
    ip: "4.2.2.4",
    location: { lat: 34.0522, lng: -118.2437, region: "North America", countryCode: "US" }
  },
  {
    id: "level3-5",
    name: "Level3 #5",
    provider: "Level3",
    ip: "4.2.2.5",
    location: { lat: 47.6062, lng: -122.3321, region: "North America", countryCode: "US" }
  },
  {
    id: "level3-6",
    name: "Level3 #6",
    provider: "Level3",
    ip: "4.2.2.6",
    location: { lat: 41.2565, lng: -95.9345, region: "North America", countryCode: "US" }
  },
  {
    id: "he-net",
    name: "Hurricane Electric",
    provider: "Hurricane Electric",
    ip: "74.82.42.42",
    location: { lat: 37.3387, lng: -121.8853, region: "North America", countryCode: "US" }
  },
  {
    id: "safedns-primary",
    name: "SafeDNS #1",
    provider: "SafeDNS",
    ip: "195.46.39.39",
    location: { lat: 50.1109, lng: 8.6821, region: "Europe", countryCode: "DE" }
  },
  {
    id: "safedns-secondary",
    name: "SafeDNS #2",
    provider: "SafeDNS",
    ip: "195.46.39.40",
    location: { lat: 59.3293, lng: 18.0686, region: "Europe", countryCode: "SE" }
  },
  {
    id: "uncensoreddns-primary",
    name: "UncensoredDNS #1",
    provider: "UncensoredDNS",
    ip: "91.239.100.100",
    location: { lat: 55.6761, lng: 12.5683, region: "Europe", countryCode: "DK" }
  },
  {
    id: "uncensoreddns-secondary",
    name: "UncensoredDNS #2",
    provider: "UncensoredDNS",
    ip: "89.233.43.71",
    location: { lat: 56.1629, lng: 10.2039, region: "Europe", countryCode: "DK" }
  },
  {
    id: "yandex-primary",
    name: "Yandex DNS #1",
    provider: "Yandex",
    ip: "77.88.8.8",
    location: { lat: 55.7558, lng: 37.6173, region: "Europe", countryCode: "RU" }
  },
  {
    id: "yandex-secondary",
    name: "Yandex DNS #2",
    provider: "Yandex",
    ip: "77.88.8.1",
    location: { lat: 59.9343, lng: 30.3351, region: "Europe", countryCode: "RU" }
  },
  {
    id: "alidns-primary",
    name: "AliDNS #1",
    provider: "Alibaba",
    ip: "223.5.5.5",
    location: { lat: 31.2304, lng: 121.4737, region: "Asia", countryCode: "CN" }
  },
  {
    id: "alidns-secondary",
    name: "AliDNS #2",
    provider: "Alibaba",
    ip: "223.6.6.6",
    location: { lat: 39.9042, lng: 116.4074, region: "Asia", countryCode: "CN" }
  },
  {
    id: "dnspod-primary",
    name: "DNSPod",
    provider: "DNSPod",
    ip: "119.29.29.29",
    location: { lat: 22.5431, lng: 114.0579, region: "Asia", countryCode: "CN" }
  },
  {
    id: "baidu-public",
    name: "Baidu DNS",
    provider: "Baidu",
    ip: "180.76.76.76",
    location: { lat: 30.5728, lng: 104.0668, region: "Asia", countryCode: "CN" }
  },
  {
    id: "dns114-primary",
    name: "114DNS #1",
    provider: "114DNS",
    ip: "114.114.114.114",
    location: { lat: 32.0603, lng: 118.7969, region: "Asia", countryCode: "CN" }
  },
  {
    id: "dns114-secondary",
    name: "114DNS #2",
    provider: "114DNS",
    ip: "114.114.115.115",
    location: { lat: 23.1291, lng: 113.2644, region: "Asia", countryCode: "CN" }
  },
  {
    id: "dnssb-primary",
    name: "DNS.SB #1",
    provider: "DNS.SB",
    ip: "185.222.222.222",
    location: { lat: 1.3521, lng: 103.8198, region: "Asia", countryCode: "SG" }
  },
  {
    id: "dnssb-secondary",
    name: "DNS.SB #2",
    provider: "DNS.SB",
    ip: "45.11.45.11",
    location: { lat: 22.3193, lng: 114.1694, region: "Asia", countryCode: "HK" }
  },
  {
    id: "iij-japan",
    name: "IIJ Public DNS",
    provider: "IIJ",
    ip: "202.232.2.100",
    location: { lat: 35.6762, lng: 139.6503, region: "Asia", countryCode: "JP" }
  },
  {
    id: "kornet-korea",
    name: "KT olleh DNS",
    provider: "KT",
    ip: "168.126.63.1",
    location: { lat: 37.5665, lng: 126.978, region: "Asia", countryCode: "KR" }
  },
  {
    id: "telecom-argentina",
    name: "Telecom Argentina DNS",
    provider: "Telecom Argentina",
    ip: "200.51.211.7",
    location: { lat: -34.6037, lng: -58.3816, region: "South America", countryCode: "AR" }
  },
  {
    id: "oi-brasil",
    name: "Oi Brasil DNS",
    provider: "Oi",
    ip: "200.221.11.100",
    location: { lat: -22.9068, lng: -43.1729, region: "South America", countryCode: "BR" }
  },
  {
    id: "telmex-mexico",
    name: "Telmex DNS",
    provider: "Telmex",
    ip: "200.23.240.34",
    location: { lat: 19.4326, lng: -99.1332, region: "North America", countryCode: "MX" }
  }
];
