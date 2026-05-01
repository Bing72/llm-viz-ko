'use client';

import React from "react";
import Link from "next/link";

export const Header: React.FC<{
    title: React.ReactNode;
    children?: React.ReactNode;
    right?: React.ReactNode;
    homeLabel?: React.ReactNode;
}> = ({ title, children, right, homeLabel }) => {

    return <div className="grid grid-cols-[1fr_auto_1fr] items-center px-2 py-1 bg-blue-950 text-white h-[2.5rem] flex-shrink-0">
        <div className="flex items-center">{children}</div>
        {title && <div className="text-2xl">{title}</div>}
        <div className="flex items-center justify-end gap-3">
            {right}
            <Link className="text-sm opacity-90 hover:underline" href="/">{homeLabel ?? 'Home'}</Link>
        </div>
    </div>;

};
