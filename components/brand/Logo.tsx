// The shelf mark. Decorative: the wordmark beside it already names the app, so the image has no alt text.
interface Props {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: Props) {
  // eslint-disable-next-line @next/next/no-img-element -- static mark; next/image would add nothing
  return <img src="/brand/mark.svg" alt="" width={size} height={size} className={className} data-testid="brand-mark" />;
}
