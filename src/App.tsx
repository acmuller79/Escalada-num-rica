import React, { useState, useEffect } from 'react';
import { Share2, Play, RefreshCw, ArrowUp, ArrowDown, Trophy, X, ChevronRight, Skull, ChevronsDown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type CellType = 'advance' | 'fallback' | 'neutral' | 'winner' | 'lose_all' | 'lose_half';
type BoardMap = Record<number, CellType>;
type GameState = 'setup' | 'playing' | 'won' | 'gameover';

type LogEntry = {
    id: number;
    msg: string;
    type: 'success' | 'error' | 'warning' | 'info';
};

export default function App() {
    const [gameState, setGameState] = useState<GameState>('setup');
    const [board, setBoard] = useState<BoardMap>({});
    const [revealed, setRevealed] = useState<Record<number, boolean>>({});
    const [currentLevel, setCurrentLevel] = useState(1);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [bgImage, setBgImage] = useState<string | null>(() => localStorage.getItem('escalada_bg') || null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = reader.result as string;
                setBgImage(b64);
                localStorage.setItem('escalada_bg', b64);
            };
            reader.readAsDataURL(file);
        }
    };

    const pushLog = (msg: string, type: LogEntry['type']) => {
        setLogs(prev => [{ id: Date.now() + Math.random(), msg, type }, ...prev]);
    };

    const generateGame = () => {
        let newBoard: BoardMap = {};

        for (let level = 1; level <= 10; level++) {
            const startNum = (level - 1) * 10 + 1;
            const endNum = level * 10;
            let nums = [];
            for (let i = startNum; i <= endNum; i++) nums.push(i);

            nums.sort(() => Math.random() - 0.5);

            if (level === 1) {
                for (let i = 0; i < 5; i++) newBoard[nums[i]] = 'advance';
                for (let i = 5; i < 10; i++) newBoard[nums[i]] = 'neutral';
            } else if (level < 5) {
                for (let i = 0; i < 4; i++) newBoard[nums[i]] = 'advance';
                for (let i = 4; i < 6; i++) newBoard[nums[i]] = 'fallback';
                for (let i = 6; i < 10; i++) newBoard[nums[i]] = 'neutral';
            } else if (level < 10) {
                for (let i = 0; i < 4; i++) newBoard[nums[i]] = 'advance';
                for (let i = 4; i < 6; i++) newBoard[nums[i]] = 'fallback';
                newBoard[nums[6]] = 'lose_half';
                newBoard[nums[7]] = 'lose_all';
                for (let i = 8; i < 10; i++) newBoard[nums[i]] = 'neutral';
            } else {
                newBoard[nums[0]] = 'winner';
                for (let i = 1; i < 3; i++) newBoard[nums[i]] = 'fallback';
                for (let i = 3; i < 6; i++) newBoard[nums[i]] = 'lose_half';
                for (let i = 6; i < 10; i++) newBoard[nums[i]] = 'lose_all';
            }
        }

        setBoard(newBoard);
        setRevealed({});
        setCurrentLevel(1);
        setGameState('playing');
        setLogs([{ id: Date.now(), msg: "Tabuleiro criptografado e pronto! Boa sorte na escalada.", type: 'info' }]);
    };

    const renderGabarito = () => {
        const results = [];
        for (let l = 10; l >= 1; l--) {
            let adv = [], fall = [], half = [], all = [], winner = 0;
            for (let i = 1; i <= 10; i++) {
                let num = (l - 1) * 10 + i;
                let type = board[num];
                if (type === 'advance') adv.push(num);
                if (type === 'fallback') fall.push(num);
                if (type === 'lose_half') half.push(num);
                if (type === 'lose_all') all.push(num);
                if (type === 'winner') winner = num;
            }
            results.push(
                <div key={l} className="text-left bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-3 space-y-1">
                    <h4 className="text-sm font-bold text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-2 mb-2">Nível {l}</h4>
                    {winner > 0 && <p className="text-yellow-400 text-sm">🏆 Vencedor: <span className="font-bold">{winner}</span></p>}
                    {adv.length > 0 && <p className="text-emerald-400 text-sm">🆙 Atalhos para Subir: {adv.join(', ')}</p>}
                    {fall.length > 0 && <p className="text-amber-500 text-sm">🔻 Armadilhas (Descer 1): {fall.join(', ')}</p>}
                    {half.length > 0 && <p className="text-fuchsia-400 text-sm">📉 Cavernas (Descer Metade): {half.join(', ')}</p>}
                    {all.length > 0 && <p className="text-rose-500 text-sm">☠️ Abismos (Perder Tudo): {all.join(', ')}</p>}
                </div>
            );
        }
        
        return (
            <div className="mt-8 max-h-[300px] overflow-y-auto pr-2 text-left border-t border-slate-700/50 pt-6" style={{ scrollbarWidth: 'thin' }}>
                 <h3 className="text-lg font-black text-slate-100 mb-4 tracking-tight flex items-center gap-2">
                     <Lock size={18} className="text-slate-400" />
                     Gabarito Oficial Revelado
                 </h3>
                 {results}
            </div>
        );
    };

    const handleNumberClick = (num: number) => {
        if (isTransitioning) return;
        const type = board[num];
        
        // Permanent reveal of the cell
        setRevealed(prev => ({ ...prev, [num]: true }));

        if (type === 'winner') {
            setIsTransitioning(true);
            pushLog(`🎉 VITÓRIA MÁXIMA! Você encontrou o prêmio (${num})!`, 'success');
            setTimeout(() => {
                setGameState('won');
                setIsTransitioning(false);
            }, 2500);
        } else if (type === 'advance') {
            setIsTransitioning(true);
            pushLog(`🚀 SUCESSO: O número ${num} impulsionou você ao Nível ${currentLevel + 1}!`, 'success');
            setTimeout(() => {
                setCurrentLevel(prev => prev + 1);
                setIsTransitioning(false);
            }, 1000);
        } else if (type === 'fallback') {
            setIsTransitioning(true);
            const nextLevel = Math.max(1, currentLevel - 1);
            pushLog(`🔻 ARMADILHA: Número ${num} escorregadio! Retornando ao Nível ${nextLevel}.`, 'warning');
            setTimeout(() => {
                setCurrentLevel(nextLevel);
                setIsTransitioning(false);
            }, 1200);
        } else if (type === 'lose_half') {
            setIsTransitioning(true);
            const nextLevel = Math.max(1, Math.ceil(currentLevel / 2));
            pushLog(`📉 QUEDA CRÍTICA: Número ${num} fez você perder metade do progresso! Indo pro Nível ${nextLevel}.`, 'error');
            setTimeout(() => {
                setCurrentLevel(nextLevel);
                setIsTransitioning(false);
            }, 1500);
        } else if (type === 'lose_all') {
            setIsTransitioning(true);
            pushLog(`☠️ ABISMO FATAL: Número ${num} destruiu seu caminho. Retornando à estaca zero (Nível 1)!`, 'error');
            setTimeout(() => {
                setCurrentLevel(1);
                setIsTransitioning(false);
            }, 1800);
        } else {
            pushLog(`❌ VAZIO: O número ${num} não leva a lugar algum. Tente outro!`, 'info');
        }
    };

    // Check if player has no moves left on the current level
    useEffect(() => {
        if (gameState === 'playing' && !isTransitioning) {
            let hasAdvanceOrWinner = false;
            for (let i = 1; i <= 10; i++) {
                const n = (currentLevel - 1) * 10 + i;
                if (!revealed[n] && (board[n] === 'advance' || board[n] === 'winner')) {
                    hasAdvanceOrWinner = true;
                    break;
                }
            }
            if (!hasAdvanceOrWinner) {
                // Determine if all cells are clicked or if remaining cells are traps/neutral
                let allRevealed = true;
                for (let i = 1; i <= 10; i++) {
                    if (!revealed[(currentLevel - 1) * 10 + i]) allRevealed = false;
                }
                
                pushLog(`🚨 ALERTA: Você esgotou todos os atalhos deste nível! Será forçado a reiniciar.`, 'error');
                setTimeout(() => {
                    setGameState('gameover');
                }, 1500);
            }
        }
    }, [revealed, currentLevel, isTransitioning, gameState, board]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12 overflow-x-hidden selection:bg-indigo-500/30 relative">
            {/* Background Image Container */}
            <div 
                className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-center bg-no-repeat bg-cover bg-fixed"
                style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }}
            />
            {/* Header */}
            <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 py-4 px-6 flex flex-col items-center justify-center shadow-lg relative z-10">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-500/10 to-teal-500/10 pointer-events-none"></div>
                <div className="flex items-center justify-center relative z-10">
                    <Trophy className="text-amber-400 mr-3 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" size={28} />
                    <h1 className="font-extrabold text-2xl tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-teal-300 drop-shadow-sm">
                        Escalada Numérica
                    </h1>
                </div>
                <div className="font-bold text-xs sm:text-sm tracking-[0.25em] text-slate-300 uppercase mt-2 relative z-10">
                    AcmullerSa
                </div>
            </header>

            <main className="p-4 sm:p-6 lg:p-10 flex items-center justify-center min-h-[85vh] relative z-10">
                <AnimatePresence mode="wait">
                    {gameState === 'setup' && (
                        <motion.div 
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 lg:p-10 max-w-xl w-full text-center relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Trophy size={200} />
                            </div>
                            
                            <h2 className="text-3xl font-black mb-4 relative z-10 tracking-tight">Preparação Máxima</h2>
                            <p className="text-slate-400 mb-8 sm:text-base text-sm leading-relaxed relative z-10 font-medium">
                                Encare um painel de 100 números, dividido em 10 níveis de pura tensão. Do nível 5 em diante, um passo em falso pode custar metade ou <strong>TODO</strong> o seu progresso.
                            </p>

                            <button onClick={generateGame} className="w-full relative z-10 py-5 rounded-2xl text-lg font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-3">
                                <Play size={20} /> Iniciar Jogo
                            </button>


                        </motion.div>
                    )}

                    {gameState === 'playing' && (
                        <motion.div 
                            key="playing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="max-w-[1400px] w-full flex flex-col xl:flex-row gap-6 relative"
                        >
                            {/* Board Column */}
                            <div className="w-full xl:w-[70%] bg-slate-900/80 border border-slate-800 rounded-[2rem] shadow-2xl p-4 sm:p-6 lg:p-8 relative backdrop-blur-sm">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-indigo-500 to-teal-500 rounded-t-[2rem]"></div>
                                
                                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                                    <h2 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">O Painel</h2>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Status Atual</span>
                                        <div className="px-5 py-2 bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30 rounded-xl flex items-center gap-2">
                                            Nível <span className="text-xl text-white">{currentLevel}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(level => {
                                        const isCurrent = level === currentLevel;
                                        const isCompleted = level < currentLevel;

                                        return (
                                            <div key={level} className={`flex gap-3 sm:gap-6 items-center rounded-2xl transition-all duration-300 p-2 sm:p-3
                                                ${isCurrent ? 'bg-slate-800/80 ring-2 ring-indigo-500 shadow-xl' : 'opacity-80'}`}
                                            >
                                                <div className="w-12 sm:w-16 flex flex-col items-center justify-center shrink-0">
                                                    <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${isCurrent ? 'text-indigo-400' : 'text-slate-600'}`}>Nível</span>
                                                    <span className={`text-2xl sm:text-4xl font-black leading-none ${isCurrent ? 'text-white' : 'text-slate-500'}`}>{level}</span>
                                                </div>
                                                
                                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3 flex-1">
                                                    {Array.from({length: 10}).map((_, i) => {
                                                        const num = (level - 1) * 10 + i + 1;
                                                        const isRev = revealed[num];
                                                        const cellType = board[num];
                                                        
                                                        let btnClass = "";
                                                        let content = null;

                                                        if (!isRev) {
                                                            if (isCurrent) {
                                                                btnClass = "bg-slate-800 border-2 border-indigo-500/50 hover:border-indigo-400 hover:bg-slate-700 shadow-[0_0_15px_rgba(99,102,241,0.15)] text-indigo-100 hover:text-white";
                                                                content = <span className="font-bold text-base sm:text-xl">{num}</span>;
                                                            } else {
                                                                btnClass = "bg-slate-900 border border-slate-800/50 text-slate-700 cursor-not-allowed";
                                                                content = <span className="font-bold text-base sm:text-lg">{num}</span>;
                                                            }
                                                        } else {
                                                            if (cellType === 'advance') {
                                                                btnClass = "bg-emerald-950/80 border border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]";
                                                                content = <ArrowUp className="w-5 h-5 sm:w-7 sm:h-7 text-emerald-400" strokeWidth={3}/>;
                                                            } else if (cellType === 'fallback') {
                                                                btnClass = "bg-amber-950/80 border border-amber-500/50 shadow-[inset_0_0_15px_rgba(245,158,11,0.2)]";
                                                                content = <ArrowDown className="w-5 h-5 sm:w-7 sm:h-7 text-amber-500" strokeWidth={3}/>;
                                                            } else if (cellType === 'lose_half') {
                                                                btnClass = "bg-fuchsia-950/80 border border-fuchsia-500/50 shadow-[inset_0_0_15px_rgba(217,70,239,0.2)]";
                                                                content = <><ChevronsDown className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400 mb-0.5" strokeWidth={3}/><span className="text-[10px] font-black text-fuchsia-300 leading-none">1/2</span></>;
                                                            } else if (cellType === 'lose_all') {
                                                                btnClass = "bg-rose-950/80 border border-rose-600/50 shadow-[inset_0_0_20px_rgba(225,29,72,0.3)]";
                                                                content = <Skull className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]" />;
                                                            } else if (cellType === 'neutral') {
                                                                btnClass = "bg-slate-900/50 border border-slate-800 text-slate-700";
                                                                content = <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" strokeWidth={3}/>;
                                                            } else if (cellType === 'winner') {
                                                                btnClass = "bg-yellow-900/40 border border-yellow-500 text-yellow-300 shadow-[0_0_30px_rgba(250,204,21,0.3)]";
                                                                content = <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-yellow-400 drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]" />;
                                                            }
                                                        }

                                                        return (
                                                            <motion.button
                                                                key={num}
                                                                disabled={!isCurrent || isRev || isTransitioning}
                                                                onClick={() => handleNumberClick(num)}
                                                                whileHover={!isRev && isCurrent && !isTransitioning ? { scale: 1.05 } : {}}
                                                                whileTap={!isRev && isCurrent && !isTransitioning ? { scale: 0.95 } : {}}
                                                                initial={false}
                                                                animate={isRev ? { scale: [0.8, 1.1, 1] } : {}}
                                                                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-colors ${btnClass}`}
                                                            >
                                                                {isRev && <span className="absolute top-1 left-1.5 text-[8px] sm:text-[10px] font-mono text-white/30 hidden sm:block leading-none font-bold">{num}</span>}
                                                                {content}
                                                            </motion.button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Sidebar Column */}
                            <div className="w-full xl:w-[30%] flex flex-col gap-6">
                                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl p-6 flex flex-col gap-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="uppercase tracking-widest text-slate-500 font-bold text-xs">Controle</h3>
                                        <Trophy size={18} className="text-slate-600" />
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Certeza que deseja abortar a escalada? Todo o progresso será perdido!')) {
                                                setGameState('setup');
                                                setRevealed({});
                                                setBoard({});
                                            }
                                        }} 
                                        className="w-full py-3 rounded-xl font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500 hover:text-white transition-all flex justify-center items-center gap-2"
                                    >
                                        <RefreshCw size={18} /> Renunciar Missão
                                    </button>
                                </div>

                                <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl shadow-xl p-6 flex-1 min-h-[300px] flex flex-col overflow-hidden relative">
                                    <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                                        <ChevronRight size={250} />
                                    </div>
                                    <h3 className="uppercase tracking-widest text-indigo-500 font-bold text-xs mb-4 flex items-center gap-2">
                                        Monitoramento de Rota <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                    </h3>
                                    
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 relative z-10" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                                        <AnimatePresence>
                                            {logs.map((log) => (
                                                <motion.div 
                                                    key={log.id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="p-3 rounded-lg border-l-2 bg-slate-900/50 backdrop-blur"
                                                    style={{
                                                        borderLeftColor: log.type === 'success' ? '#34d399' : log.type === 'error' ? '#fb7185' : log.type === 'warning' ? '#fbbf24' : '#6366f1'
                                                    }}
                                                >
                                                    <span className={`text-sm leading-snug font-medium ${
                                                        log.type === 'success' ? 'text-emerald-400' :
                                                        log.type === 'error' ? 'text-rose-400' :
                                                        log.type === 'warning' ? 'text-amber-400' : 'text-indigo-300'
                                                    }`}>
                                                        {log.msg}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {gameState === 'won' && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-3xl p-10 max-w-xl w-full text-center relative overflow-hidden shadow-[0_0_100px_rgba(250,204,21,0.1)]"
                        >
                            <div className="bg-yellow-500/20 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                <Trophy size={64} className="text-yellow-400 relative z-10" />
                                <div className="absolute inset-0 border-4 border-yellow-400 rounded-full animate-ping opacity-30"></div>
                            </div>
                            <h2 className="text-4xl font-black text-white mb-4 tracking-tight drop-shadow-lg">Você Sobreviveu!</h2>
                            <p className="text-lg text-yellow-100/70 mb-10">
                                O número oculto no topo foi finalmente revelado. Excelente escalada!
                            </p>
                            <button 
                                onClick={() => { setGameState('setup'); setBoard({}); }} 
                                className="w-full py-4 rounded-xl text-lg font-bold bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-xl transition-all"
                            >
                                Iniciar Nova Escalada
                            </button>

                            {renderGabarito()}
                        </motion.div>
                    )}

                    {gameState === 'gameover' && (
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-rose-950/40 border-2 border-rose-500/50 rounded-3xl p-10 max-w-xl w-full text-center relative overflow-hidden shadow-[0_0_100px_rgba(225,29,72,0.15)] mt-10 md:mt-16 mb-20"
                        >
                            <div className="bg-rose-500/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Skull size={50} className="text-rose-500" />
                            </div>
                            <h2 className="text-4xl font-black text-rose-500 mb-4 tracking-tighter">FIM DE JOGO</h2>
                            <p className="text-lg text-rose-200/60 mb-10">
                                Você esgotou todas as suas chances de avanço ou encontrou o abismo fatal sem saída. O caminho está selado.
                            </p>
                            <button 
                                onClick={() => { setGameState('setup'); setBoard({}); }} 
                                className="w-full py-4 rounded-xl text-lg font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all"
                            >
                                Aceitar a Derrota e Tentar Novamente
                            </button>
                            
                            {renderGabarito()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
