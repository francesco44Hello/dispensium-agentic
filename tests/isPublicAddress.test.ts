import { describe, it, expect } from 'vitest';
import { isPublicAddress } from '../utils/isPublicAddress';

describe('isPublicAddress (IPv4 special-use ranges)', () => {
  it('refuses the IETF protocol assignments block 192.0.0.0/24', () => {
    expect(isPublicAddress('192.0.0.1')).toBe(false);
    expect(isPublicAddress('192.0.0.170')).toBe(false);
    expect(isPublicAddress('192.0.0.255')).toBe(false);
  });

  it('refuses the deprecated 6to4 relay anycast block 192.88.99.0/24', () => {
    expect(isPublicAddress('192.88.99.0')).toBe(false);
    expect(isPublicAddress('192.88.99.1')).toBe(false);
    expect(isPublicAddress('192.88.99.255')).toBe(false);
  });

  it('keeps public addresses next to those blocks allowed', () => {
    expect(isPublicAddress('192.0.1.1')).toBe(true);
    expect(isPublicAddress('192.88.98.1')).toBe(true);
    expect(isPublicAddress('192.88.100.1')).toBe(true);
    expect(isPublicAddress('8.8.8.8')).toBe(true);
  });
});

describe('isPublicAddress (IPv6 non-canonical forms)', () => {
  it('refuses the loopback ::1 when written in full or with leading zeros', () => {
    expect(isPublicAddress('0:0:0:0:0:0:0:1')).toBe(false);
    expect(isPublicAddress('0000::1')).toBe(false);
    expect(isPublicAddress('0000:0000:0000:0000:0000:0000:0000:0001')).toBe(false);
    expect(isPublicAddress('::0001')).toBe(false);
  });

  it('refuses the unspecified address :: when written in full or with leading zeros', () => {
    expect(isPublicAddress('0:0:0:0:0:0:0:0')).toBe(false);
    expect(isPublicAddress('0000::')).toBe(false);
    expect(isPublicAddress('::')).toBe(false);
  });

  it('refuses IPv4-mapped loopback written with a non-canonical prefix', () => {
    expect(isPublicAddress('0:0:0:0:0:ffff:127.0.0.1')).toBe(false);
    expect(isPublicAddress('0000:0000:0000:0000:0000:FFFF:10.0.0.1')).toBe(false);
  });

  it('refuses link-local, unique-local and documentation prefixes written in full', () => {
    expect(isPublicAddress('FE80:0000:0000:0000:0000:0000:0000:0001')).toBe(false);
    expect(isPublicAddress('fd00:0000:0000:0000:0000:0000:0000:0001')).toBe(false);
    expect(isPublicAddress('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(false);
  });

  it('keeps a public address written in full allowed', () => {
    expect(isPublicAddress('2606:4700:4700:0000:0000:0000:0000:1111')).toBe(true);
  });

  it('refuses a malformed IPv6 string instead of judging it public', () => {
    expect(isPublicAddress('zzzz::1')).toBe(false);
    expect(isPublicAddress('1:2:3:4:5:6:7:8:9')).toBe(false);
  });
});

describe('isPublicAddress (documentation and example ranges)', () => {
  it('refuses the TEST-NET-1 documentation block 192.0.2.0/24', () => {
    expect(isPublicAddress('192.0.2.0')).toBe(false);
    expect(isPublicAddress('192.0.2.1')).toBe(false);
    expect(isPublicAddress('192.0.2.255')).toBe(false);
  });

  it('refuses the TEST-NET-2 documentation block 198.51.100.0/24', () => {
    expect(isPublicAddress('198.51.100.0')).toBe(false);
    expect(isPublicAddress('198.51.100.77')).toBe(false);
    expect(isPublicAddress('198.51.100.255')).toBe(false);
  });

  it('refuses the TEST-NET-3 documentation block 203.0.113.0/24', () => {
    expect(isPublicAddress('203.0.113.0')).toBe(false);
    expect(isPublicAddress('203.0.113.9')).toBe(false);
    expect(isPublicAddress('203.0.113.255')).toBe(false);
  });

  it('keeps public addresses next to those blocks allowed', () => {
    expect(isPublicAddress('192.0.3.1')).toBe(true);
    expect(isPublicAddress('198.51.101.1')).toBe(true);
    expect(isPublicAddress('203.0.114.1')).toBe(true);
  });

  it('refuses the IPv6 documentation prefix 2001:db8::/32', () => {
    expect(isPublicAddress('2001:db8::1')).toBe(false);
    expect(isPublicAddress('2001:DB8:0:0:0:0:0:1')).toBe(false);
    expect(isPublicAddress('2001:0db8::1')).toBe(false);
  });

  it('keeps IPv6 addresses next to the documentation prefix allowed', () => {
    expect(isPublicAddress('2001:db9::1')).toBe(true);
    expect(isPublicAddress('2606:4700:4700::1111')).toBe(true);
  });
});
