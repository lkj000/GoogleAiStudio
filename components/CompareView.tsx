
import React, { useState, useMemo } from 'react';
import { PluginTemplate, ProjectSnapshot, PluginParameter } from '../types';
import { RestoreIcon, CompareIcon } from './icons';

type DiffLine = {
    line: string;
    type: 'added' | 'removed' | 'common';
    lineNumberA?: number;
    lineNumberB?: number;
};

// A simple line-diffing algorithm based on Longest Common Subsequence (LCS)
const diffCodeLines = (codeA: string, codeB: string): DiffLine[] => {
    const linesA = codeA.split('\n');
    const linesB = codeB.split('\n');
    const n = linesA.length;
    const m = linesB.length;
    const dp = Array(n + 1).fill(null).map(() => Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
            if (linesA[i - 1] === linesB[j - 1]) {
                dp[i][j] = 1 + dp[i - 1][j - 1];
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    const diff: DiffLine[] = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
            diff.unshift({ line: linesA[i - 1], type: 'common', lineNumberA: i, lineNumberB: j });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            diff.unshift({ line: linesB[j - 1], type: 'added', lineNumberB: j });
            j--;
        } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
            diff.unshift({ line: linesA[i - 1], type: 'removed', lineNumberA: i });
            i--;
        } else {
            break;
        }
    }
    return diff;
};


const CodeDiffView: React.FC<{ codeA: string; codeB: string }> = ({ codeA, codeB }) => {
    const diff = useMemo(() => diffCodeLines(codeA, codeB), [codeA, codeB]);
    
    return (
        <pre className="bg-[#1E1E1E] p-4 rounded-lg font-mono text-xs overflow-auto">
            {diff.map((item, index) => {
                const colors = {
                    added: 'bg-green-500/20',
                    removed: 'bg-hot-pink/20',
                    common: '',
                };
                return (
                    <div key={index} className={`flex ${colors[item.type]}`}>
                        <span className="w-10 text-right pr-2 text-secondary/50 select-none">{item.lineNumberA || ''}</span>
                        <span className="w-10 text-right pr-2 text-secondary/50 select-none">{item.lineNumberB || ''}</span>
                        <span className="flex-1">
                            <span className="mr-2 text-secondary/50 select-none">
                                {item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' '}
                            </span>
                            <span className={item.type === 'common' ? 'text-secondary' : 'text-primary'}>{item.line}</span>
                        </span>
                    </div>
                );
            })}
        </pre>
    );
};

const ParamsDiffView: React.FC<{ paramsA: PluginParameter[], paramsB: PluginParameter[] }> = ({ paramsA, paramsB }) => {
    const paramMapA = new Map(paramsA.map(p => [p.id, p]));
    const paramMapB = new Map(paramsB.map(p => [p.id, p]));
    const allIds = new Set([...paramMapA.keys(), ...paramMapB.keys()]);

    return (
        <div className="bg-surface rounded-lg border border-background overflow-hidden">
             <table className="w-full text-sm text-left text-secondary">
                <thead className="bg-background/50 text-xs text-secondary uppercase">
                    <tr>
                        <th scope="col" className="px-6 py-3">Param ID</th>
                        <th scope="col" className="px-6 py-3">State</th>
                        <th scope="col" className="px-6 py-3">Details</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from(allIds).map(id => {
                        const pA = paramMapA.get(id);
                        const pB = paramMapB.get(id);
                        const state = pA && pB ? 'Modified' : pA ? 'Removed' : 'Added';
                        const changeColor = {
                            Added: 'bg-green-500/20',
                            Removed: 'bg-hot-pink/20',
                            Modified: 'bg-blue-500/20',
                        };

                        const detailsA = pA ? Object.entries(pA).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
                        const detailsB = pB ? Object.entries(pB).map(([k, v]) => `${k}: ${v}`).join(', ') : '';
                        const isModified = pA && pB && detailsA !== detailsB;

                        return (
                            <tr key={id} className={`border-b border-background ${isModified ? changeColor.Modified : ''}`}>
                                <td className="px-6 py-4 font-mono text-accent">{id}</td>
                                <td className={`px-6 py-4 font-semibold ${state === 'Added' ? 'text-green-400' : state === 'Removed' ? 'text-hot-pink' : 'text-blue-400'}`}>{isModified ? 'Modified' : state}</td>
                                <td className="px-6 py-4 text-xs font-mono">
                                    {pA && <div className={`${state === 'Removed' || isModified ? 'line-through text-secondary/70' : ''}`}>{detailsA}</div>}
                                    {pB && <div className={`${state === 'Added' || isModified ? 'text-primary' : ''}`}>{detailsB}</div>}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}


interface SnapshotCompareViewProps {
    project: PluginTemplate;
    code: string;
    snapshots: ProjectSnapshot[];
    onRestore: (snapshot: ProjectSnapshot) => void;
}

const SnapshotCompareView: React.FC<SnapshotCompareViewProps> = ({ project, code, snapshots, onRestore }) => {
    const [selectionA, setSelectionA] = useState('current');
    const [selectionB, setSelectionB] = useState<string>(snapshots.length > 0 ? snapshots[snapshots.length - 1].id : 'none');

    const currentProjectState: ProjectSnapshot = {
        id: 'current',
        name: 'Current Project',
        timestamp: new Date().toISOString(),
        project: { ...project, code: code }
    };
    
    const allOptions: (ProjectSnapshot & { isCurrent?: boolean })[] = [
        { ...currentProjectState, isCurrent: true },
        ...snapshots,
    ];

    const findSelection = (id: string) => allOptions.find(s => s.id === id) || null;
    
    const itemA = findSelection(selectionA);
    const itemB = findSelection(selectionB);

    return (
        <div className="p-8 h-full flex gap-8">
            <aside className="w-1/4 flex-shrink-0 flex flex-col">
                <h3 className="text-xl font-bold text-primary mb-2">Project Snapshots</h3>
                <p className="text-secondary mb-6 text-sm">Select a snapshot to restore it.</p>
                <div className="flex-grow overflow-y-auto space-y-3 pr-2 bg-background/50 p-3 rounded-lg border border-surface">
                    {snapshots.length === 0 && <p className="text-secondary text-sm text-center p-4">No snapshots taken yet.</p>}
                    {snapshots.map(snap => (
                        <div key={snap.id} className="bg-surface p-3 rounded-lg flex justify-between items-center group">
                            <div>
                                <p className="font-semibold text-primary">{snap.name}</p>
                                <p className="text-xs text-secondary font-mono">{new Date(snap.timestamp).toLocaleString()}</p>
                            </div>
                            <button onClick={() => onRestore(snap)} className="opacity-0 group-hover:opacity-100 text-secondary hover:text-accent transition-opacity p-1" title="Restore this snapshot">
                                <RestoreIcon />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            <main className="flex-grow flex flex-col min-w-0">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-primary">Comparison View</h3>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="relative">
                        <label className="absolute -top-2 left-3 bg-background px-1 text-xs text-secondary">Compare A</label>
                        <select value={selectionA} onChange={e => setSelectionA(e.target.value)} className="w-full bg-surface border border-background rounded-md py-3 px-4 text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                            {allOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </div>
                    <div className="relative">
                        <label className="absolute -top-2 left-3 bg-background px-1 text-xs text-secondary">Compare B</label>
                        <select value={selectionB} onChange={e => setSelectionB(e.target.value)} className="w-full bg-surface border border-background rounded-md py-3 px-4 text-primary focus:outline-none focus:ring-2 focus:ring-accent">
                             <option value="none" disabled>Select a snapshot</option>
                            {allOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2">
                    {!itemA || !itemB ? (
                        <div className="h-full flex flex-col justify-center items-center text-center text-secondary">
                            <CompareIcon />
                            <p className="mt-2 font-semibold">Select two versions to compare</p>
                            <p>You can compare your current project against any snapshot.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-lg font-semibold text-primary mb-3">Parameters Diff</h4>
                                <ParamsDiffView paramsA={itemA.project.parameters} paramsB={itemB.project.parameters} />
                            </div>
                             <div>
                                <h4 className="text-lg font-semibold text-primary mb-3">Signal Chain Diff</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-surface p-3 rounded-lg border border-background">
                                        <h5 className="text-xs text-secondary mb-2">Chain A: {itemA.name}</h5>
                                        <ul className="text-sm font-mono">{itemA.project.signalChain?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                    <div className="bg-surface p-3 rounded-lg border border-background">
                                         <h5 className="text-xs text-secondary mb-2">Chain B: {itemB.name}</h5>
                                        <ul className="text-sm font-mono">{itemB.project.signalChain?.map((s,i) => <li key={i}>{s}</li>)}</ul>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-lg font-semibold text-primary mb-3">Code Diff</h4>
                                <CodeDiffView codeA={itemA.project.code} codeB={itemB.project.code} />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SnapshotCompareView;