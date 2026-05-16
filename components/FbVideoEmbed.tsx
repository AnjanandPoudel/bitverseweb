'use client';

import Image from 'next/image';
import { useState } from 'react';

interface IFbVideoEmbedProps {
  reelId: string;
  coverSrc: string;
  coverAlt?: string;
}

export function FbVideoEmbed({ reelId, coverSrc, coverAlt = 'Video cover' }: IFbVideoEmbedProps): React.ReactElement {
  const [loaded, setLoaded] = useState<boolean>(false);

  const src = `https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F${reelId}&show_text=false&width=325&height=560`;

  return (
    <div className="lp-video-wrapper">
      {!loaded && (
        <div className="lp-video-cover">
          <Image src={coverSrc} alt={coverAlt} fill className="lp-video-cover-img" />
          <div className="lp-video-play-btn">▶</div>
        </div>
      )}
      <iframe
        src={src}
        width="325"
        height="560"
        style={{ border: 'none', overflow: 'hidden', borderRadius: '12px', display: 'block' }}
        scrolling="no"
        frameBorder={0}
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
        allowFullScreen
        title="Bitverse Tuition Facebook Reel"
        onLoad={(): void => setLoaded(true)}
      />
    </div>
  );
}
