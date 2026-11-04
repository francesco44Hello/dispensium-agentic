import { Suspense } from 'react';
import { JoinInvite } from '../../../components/household/JoinInvite';

// The code comes from the URL, so each invite is read per request, never prerendered.
async function JoinFromParams({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <JoinInvite code={code} />;
}

// The shared invite link. Opening it shows who invited the person and lets them accept.
export default function JoinPage({ params }: PageProps<'/join/[code]'>) {
  return (
    <main className="viewport">
      <Suspense fallback={null}>
        <JoinFromParams params={params} />
      </Suspense>
    </main>
  );
}
