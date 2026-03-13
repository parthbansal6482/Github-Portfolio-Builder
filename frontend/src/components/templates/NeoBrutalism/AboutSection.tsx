import React from 'react';
import type { GeneratedCopy } from '@/types';

export default function AboutSection({ copy }: { copy: GeneratedCopy }) {
    return (
        <section style={{
            background: '#fff',
            border: '4px solid #000',
            boxShadow: '8px 8px 0 0 #000',
            padding: '40px',
            borderRadius: '8px'
        }}>
            <h3 style={{
                fontSize: '32px',
                textTransform: 'uppercase',
                fontWeight: 900,
                margin: '0 0 24px 0',
                borderBottom: '4px solid #000',
                paddingBottom: '12px',
                display: 'inline-block'
            }}>
                User.Manual
            </h3>
            <p style={{
                fontSize: '20px',
                lineHeight: 1.6,
                fontWeight: 600,
                margin: 0,
                whiteSpace: 'pre-wrap'
            }}>
                {copy.about}
            </p>
        </section>
    );
}
