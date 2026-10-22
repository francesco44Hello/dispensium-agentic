// True only for addresses on the public internet. Anything local, private, shared, link-local or reserved is refused,
// so the importer cannot be pointed at our own network or cloud metadata endpoints.
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function isPublicIpv4(ip: string): boolean {
  const match = IPV4.exec(ip);
  if (!match) return false;
  const [a, b, c] = match.slice(1, 4).map(Number);
  if (match.slice(1).some((octet) => Number(octet) > 255)) return false;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && c === 0) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  return true;
}

function isPublicIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower.startsWith('::ffff:')) {
    const mapped = lower.slice('::ffff:'.length);
    // Mapped IPv4 is judged by its IPv4 rules. Hex-mapped forms are refused.
    return IPV4.test(mapped) && isPublicIpv4(mapped);
  }
  // ::/96 (IPv4-compatible, loopback, unspecified) and the NAT64 and 6to4 prefixes can embed private IPv4.
  if (lower.startsWith('::') || lower.startsWith('64:ff9b:') || lower.startsWith('2002:')) return false;
  // Teredo (2001::/32) and the discard prefix (100::/64) are not public destinations.
  if (lower.startsWith('2001:0:') || lower.startsWith('2001::') || lower.startsWith('100::')) return false;
  const first = parseInt(lower.split(':')[0] || '0', 16);
  if (first >= 0xfc00 && first <= 0xfdff) return false; // unique local fc00::/7
  if (first >= 0xfe80 && first <= 0xfebf) return false; // link-local fe80::/10
  if (first >= 0xff00) return false; // multicast ff00::/8
  return true;
}

export function isPublicAddress(ip: string): boolean {
  if (ip.includes(':')) return isPublicIpv6(ip);
  return isPublicIpv4(ip);
}
