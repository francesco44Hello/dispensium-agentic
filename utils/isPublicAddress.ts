// True only for addresses on the public internet. Anything local, private, shared, link-local or reserved is refused,
// so the importer cannot be pointed at our own network or cloud metadata endpoints.
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const HEXTET = /^[0-9a-f]{1,4}$/;

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
  if (a === 192 && b === 0 && c === 0) return false; // 192.0.0.0/24 IETF protocol assignments
  if (a === 192 && b === 88 && c === 99) return false; // 192.88.99.0/24 deprecated 6to4 relay anycast
  if (a === 192 && b === 0 && c === 2) return false; // 192.0.2.0/24 TEST-NET-1 documentation
  if (a === 198 && b === 51 && c === 100) return false; // 198.51.100.0/24 TEST-NET-2 documentation
  if (a === 203 && b === 0 && c === 113) return false; // 203.0.113.0/24 TEST-NET-3 documentation
  if (a === 198 && (b === 18 || b === 19)) return false;
  return true;
}

// Expands an IPv6 address to its eight 16-bit groups, whatever the written form: leading zeros, "::" or a dotted IPv4 tail.
// Returns null for a malformed address, which callers treat as not public.
// dottedTail is true when the address ends in a dotted IPv4 address, such as ::ffff:8.8.8.8.
function expandIpv6(ip: string): { groups: number[]; dottedTail: boolean } | null {
  let text = ip.toLowerCase();
  let dottedTail = false;
  const tail = /:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(text);
  if (tail) {
    const dotted = tail[1];
    if (!IPV4.test(dotted)) return null;
    const [a, b, c, d] = dotted.split('.').map(Number);
    if ([a, b, c, d].some((octet) => octet > 255)) return null;
    text = `${text.slice(0, -dotted.length)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
    dottedTail = true;
  }

  const halves = text.split('::');
  if (halves.length > 2) return null;
  const compressed = halves.length === 2;
  const head = halves[0] === '' ? [] : halves[0].split(':');
  const rest = compressed && halves[1] !== '' ? halves[1].split(':') : [];
  const fill = 8 - head.length - rest.length;
  if (compressed ? fill < 1 : fill !== 0) return null;

  const parts = [...head, ...Array<string>(compressed ? fill : 0).fill('0'), ...rest];
  if (parts.length !== 8 || !parts.every((part) => HEXTET.test(part))) return null;
  return { groups: parts.map((part) => parseInt(part, 16)), dottedTail };
}

function isPublicIpv6(ip: string): boolean {
  const expanded = expandIpv6(ip);
  if (!expanded) return false;
  const { groups: g, dottedTail } = expanded;

  // IPv4-mapped ::ffff:a.b.c.d is judged by its IPv4 rules. Hex-mapped forms are refused.
  if (g.slice(0, 5).every((group) => group === 0) && g[5] === 0xffff) {
    if (!dottedTail) return false;
    return isPublicIpv4(`${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`);
  }
  // Only 2000::/3 is globally routed unicast. This also refuses the unspecified address, loopback and IPv4-compatible ::/96,
  // and the unique-local fc00::/7, link-local fe80::/10 and multicast ff00::/8 ranges.
  if ((g[0] & 0xe000) !== 0x2000) return false;
  // NAT64 64:ff9b::/32, 6to4 2002::/16 and Teredo 2001::/32 can embed private IPv4 addresses.
  if ((g[0] === 0x64 && g[1] === 0xff9b) || g[0] === 0x2002 || (g[0] === 0x2001 && g[1] === 0)) return false;
  // Discard prefix 100::/64.
  if (g[0] === 0x100 && g[1] === 0 && g[2] === 0 && g[3] === 0) return false;
  // 2001:db8::/32 documentation prefix.
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false;
  return true;
}

export function isPublicAddress(ip: string): boolean {
  if (ip.includes(':')) return isPublicIpv6(ip);
  return isPublicIpv4(ip);
}
