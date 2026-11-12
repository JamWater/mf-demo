import React from 'react';

interface Props {
  title: string;
}

export function SectionHeader({ title }: Props) {
  return (
    <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: 8 }}>
      {title}
    </h3>
  );
}
