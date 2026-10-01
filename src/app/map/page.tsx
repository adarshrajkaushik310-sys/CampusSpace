'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BubbleButton } from '@/components/BubbleButton';
import { Building, ArrowRight } from 'lucide-react';

export default function CampusMapRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/facilities');
  }, [router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center mx-auto">
        <Building className="w-6 h-6" />
      </div>
      <h2 className="text-xl font-bold text-slate-800">Redirecting to Campus Facilities...</h2>
      <p className="text-sm text-slate-500 max-w-md">
        Campus facility booking has moved to the unified Facilities directory.
      </p>
      <BubbleButton href="/facilities" variant="primary" size="md" icon={<ArrowRight className="w-4 h-4" />}>
        Continue to Facilities
      </BubbleButton>
    </div>
  );
}
