import React from 'react';
import Navbar from '../components/Navbar';
import FamilyTree from '../components/FamilyTree';

export default function FamilyTreeView() {
    return (
        <div className="min-h-screen bg-[#F6FBF7] flex flex-col">
            <Navbar />
            <main className="flex-1 max-w-max-width w-full mx-auto px-margin-mobile md:px-margin-desktop py-xxl flex flex-col">
                <h1 className="font-headline-lg text-headline-lg font-bold mb-4">Pohon Keluarga</h1>
                <div className="flex-1 bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 p-lg">
                    <FamilyTree />
                </div>
            </main>
        </div>
    );
}