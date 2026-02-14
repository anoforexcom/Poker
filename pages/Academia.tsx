import React, { useState } from 'react';
import { getModules, Module, Question } from '../utils/academiaData';
import { useNotification } from '../contexts/NotificationContext';

const Academia: React.FC = () => {
  const modules = getModules();
  const { showAlert } = useNotification();

  // Persistence State
  const [userProgress, setUserProgress] = useState<Record<string, { bestScore: number; completed: boolean }>>(() => {
    const saved = localStorage.getItem('poker_academy_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const [isPro, setIsPro] = useState<boolean>(() => {
    return localStorage.getItem('poker_academy_pro_status') === 'true';
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('poker_academy_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Computed Global Progress
  const totalModules = modules.length;
  const completedModules = (Object.values(userProgress) as { completed: boolean }[]).filter(p => p.completed).length;
  const globalProgress = (completedModules / totalModules) * 100;

  // --- Actions ---

  const handleStartModule = async (module: Module) => {
    // Check Lock Status
    const isLocked = !isPro && (module.id === 'mtt' || module.id === 'mental'); // Lock last 2 modules
    if (isLocked) {
      await showAlert("This module is for PRO members only. Upgrade to unlock!", "info", { title: "Exclusive Content" });
      return;
    }

    setActiveModule(module);
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowResult(false);
    resetQuestionState();
  };

  const handleUpgrade = async () => {
    // Simulate Payment
    const confirmed = await showAlert("Upgrade to PRO for $9.99/mo?", "info", {
      showCancel: true,
      confirmText: "Upgrade Now",
      title: "Go Pro"
    });

    if (confirmed) {
      setIsPro(true);
      localStorage.setItem('poker_academy_pro_status', 'true');
      await showAlert("Welcome to the Elite! You are now a PRO member.", "success", { title: "Success" });
    }
  };

  const toggleBookmark = (questionId: string) => {
    setBookmarks(prev => {
      const newBookmarks = prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId];

      localStorage.setItem('poker_academy_bookmarks', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  const resetQuestionState = () => {
    setSelectedOption(null);
    setIsAnswered(false);
  };

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered || !activeModule) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);

    if (optionIndex === activeModule.questions[currentQuestionIndex].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const handleNext = () => {
    if (!activeModule) return;
    if (currentQuestionIndex + 1 < activeModule.questions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      resetQuestionState();
    } else {
      finishModule();
    }
  };

  const finishModule = () => {
    if (!activeModule) return;

    // Calculate final score
    // We need to account for the last answer if it was just clicked?
    // handleAnswer updates score immediately, so 'score' is current.
    // Wait, handleAnswer updates 'score' state, which might be async batched, but usually fine here.

    setShowResult(true);

    // Save Progress
    const passingScore = Math.ceil(activeModule.questions.length * 0.7);
    const passed = score >= passingScore;

    setUserProgress(prev => {
      const currentBest = prev[activeModule.id]?.bestScore || 0;
      const isComplete = prev[activeModule.id]?.completed || passed;

      const newProgress = {
        ...prev,
        [activeModule.id]: {
          bestScore: Math.max(currentBest, score),
          completed: isComplete
        }
      };

      localStorage.setItem('poker_academy_progress', JSON.stringify(newProgress));
      return newProgress;
    });
  };

  const handleExit = () => {
    setActiveModule(null);
  };

  // --- Views ---

  if (!activeModule) {
    // Module Selection View
    return (
      <div className="p-4 md:p-8 max-w-[1440px] mx-auto h-full overflow-y-auto custom-scrollbar">
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">
              Poker <span className="text-primary">Academia</span>
            </h1>
            <p className="text-slate-400 font-bold mb-4">Master the game with our structured learning modules.</p>

            {!isPro ? (
              <button onClick={handleUpgrade} className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-black uppercase tracking-widest rounded-lg shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                <span className="material-symbols-outlined">verified</span> Upgrade to PRO
              </button>
            ) : (
              <div className="px-4 py-2 bg-slate-800 border border-gold/50 text-gold font-black uppercase tracking-widest rounded-lg inline-flex items-center gap-2">
                <span className="material-symbols-outlined">workspace_premium</span> PRO Member
              </div>
            )}
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 w-full md:w-64 shadow-lg">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-white uppercase tracking-tight">Course Mastery</span>
              <span className="text-primary">{Math.round(globalProgress)}%</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${globalProgress}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 text-right">{completedModules}/{totalModules} Modules</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map(module => {
            const progress = userProgress[module.id];
            const isCompleted = progress?.completed;
            const bestScore = progress?.bestScore || 0;

            // Logic for locking premium modules
            const isPremium = module.id === 'mtt' || module.id === 'mental';
            const isLocked = isPremium && !isPro;

            return (
              <div key={module.id} className={`group bg-slate-800 rounded-2xl border p-6 transition-all cursor-pointer shadow-lg relative overflow-hidden ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''} ${isCompleted ? 'border-green-500/30' : 'border-slate-700 hover:border-primary/50'}`} onClick={() => handleStartModule(module)}>
                {isCompleted && <div className="absolute top-4 right-4 text-green-500"><span className="material-symbols-outlined">check_circle</span></div>}
                {isPremium && !isPro && <div className="absolute top-4 right-4 text-amber-500"><span className="material-symbols-outlined">lock</span></div>}

                <div className="absolute top-0 right-0 p-20 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>

                <div className="relative z-10">
                  <div className={`w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-4 border transition-colors ${isCompleted ? 'border-green-500/50' : 'border-slate-700 group-hover:border-primary'}`}>
                    <span className={`material-symbols-outlined text-2xl ${isCompleted ? 'text-green-500' : 'text-gold'}`}>{module.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{module.title}</h3>
                  <p className="text-sm text-slate-400 mb-6 min-h-[40px]">{module.description}</p>

                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-bold text-slate-500">
                      <span>Progress</span>
                      <span>{bestScore}/{module.questions.length}</span>
                    </div>
                    <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                        style={{ width: `${(bestScore / module.questions.length) * 100}%` }}
                      ></div>
                    </div>
                    <button className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-all mt-2 ${isLocked ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : isCompleted ? 'bg-green-500/10 text-green-500' : 'bg-slate-700 text-slate-300 group-hover:bg-primary group-hover:text-white'}`}>
                      {isLocked ? 'PRO ONLY' : isCompleted ? 'REVIEW MODULE' : bestScore > 0 ? 'CONTINUE' : 'START MODULE'}
                      {!isLocked && !isCompleted && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                      {isLocked && <span className="material-symbols-outlined text-sm">lock</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (showResult) {
    // Result View
    const percentage = Math.round((score / activeModule.questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-900">
        <div className="bg-slate-800 p-12 rounded-3xl border border-slate-700 shadow-2xl text-center max-w-lg w-full relative overflow-hidden">
          <div className={`absolute inset-0 opacity-20 blur-3xl ${passed ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <div className="relative z-10">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center border-4 ${passed ? 'border-green-500 bg-green-500/20 text-green-500' : 'border-red-500 bg-red-500/20 text-red-500'}`}>
              <span className="material-symbols-outlined text-5xl">{passed ? 'emoji_events' : 'sentiment_dissatisfied'}</span>
            </div>

            <h2 className="text-3xl font-black text-white mb-2">{passed ? 'Module Completed!' : 'Try Again'}</h2>
            <p className="text-slate-400 mb-8">{passed ? 'You have mastered this topic.' : 'Keep studying and improve your score.'}</p>

            <div className="flex justify-center gap-8 mb-8">
              <div>
                <span className="block text-3xl font-bold text-white">{score}/{activeModule.questions.length}</span>
                <span className="text-xs uppercase font-bold text-slate-500">Correct</span>
              </div>
              <div>
                <span className={`block text-3xl font-bold ${passed ? 'text-green-500' : 'text-red-500'}`}>{percentage}%</span>
                <span className="text-xs uppercase font-bold text-slate-500">Accuracy</span>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={handleExit} className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition">Back to Menu</button>
              <button onClick={() => handleStartModule(activeModule)} className="px-6 py-3 rounded-xl font-bold bg-primary text-white shadow-lg hover:bg-blue-600 transition">Restart Module</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active Quiz View
  const currentQ = activeModule.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / activeModule.questions.length) * 100;
  const isBookmarked = bookmarks.includes(currentQ.id);

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Quiz Header */}
      <div className="h-2 bg-slate-800 w-full">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
      </div>

      <header className="px-4 md:px-8 py-4 md:py-6 flex justify-between items-center border-b border-slate-800">
        <div>
          <h2 className="text-[10px] md:text-sm font-bold text-slate-500 uppercase tracking-widest truncate max-w-[120px] xs:max-w-none">{activeModule.title}</h2>
          <p className="text-white font-mono text-[10px] md:text-xs mt-1">Q{currentQuestionIndex + 1} of {activeModule.questions.length}</p>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => toggleBookmark(currentQ.id)} className={`flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold uppercase transition-colors ${isBookmarked ? 'text-primary' : 'text-slate-400 hover:text-white'}`}>
            <span className={`material-symbols-outlined text-base md:text-lg ${isBookmarked ? 'fill-1' : ''}`}>bookmark</span>
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>
          <div className="h-4 w-px bg-slate-700"></div>
          <button onClick={handleExit} className="text-slate-400 hover:text-white flex items-center gap-1 md:gap-2 text-[10px] md:text-xs font-bold uppercase">
            <span className="material-symbols-outlined text-base md:text-lg">close</span> <span className="hidden sm:inline">Quit</span>
          </button>
        </div>
      </header>

      {/* Question Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl w-full">
          <h3 className="text-xl xs:text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8 leading-tight">{currentQ.text}</h3>

          <div className="space-y-4 mb-8">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = currentQ.correctIndex === idx;

              let stateClass = 'bg-slate-800 border-slate-700 hover:border-slate-500 text-slate-300';
              if (isAnswered) {
                if (isCorrect) stateClass = 'bg-green-500/10 border-green-500 text-green-500';
                else if (isSelected && !isCorrect) stateClass = 'bg-red-500/10 border-red-500 text-red-500';
                else stateClass = 'bg-slate-800 border-slate-700 opacity-50';
              } else if (isSelected) {
                stateClass = 'bg-primary/20 border-primary text-white';
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleAnswer(idx)}
                  className={`w-full p-4 md:p-6 rounded-xl border-2 text-left transition-all flex justify-between items-center group ${stateClass}`}
                >
                  <span className="font-bold text-base md:text-lg">{option}</span>
                  {isAnswered && isCorrect && <span className="material-symbols-outlined text-2xl">check_circle</span>}
                  {isAnswered && isSelected && !isCorrect && <span className="material-symbols-outlined text-2xl">cancel</span>}
                </button>
              );
            })}
          </div>

          {/* Explanation / Next */}
          {isAnswered && (
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 animate-fade-in relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 p-16 bg-gold/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

              <h4 className="font-bold text-white mb-4 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-gold">lightbulb</span> Explanation
              </h4>

              {/* Main Text */}
              <p className="text-slate-300 text-sm mb-6 leading-relaxed relative z-10 border-l-2 border-slate-600 pl-4">
                {currentQ.explanation.text}
              </p>

              {/* Pro Tip Section */}
              {currentQ.explanation.tip && (
                <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6 relative z-10">
                  <div className="flex gap-3">
                    <span className="material-symbols-outlined text-gold shrink-0">verified</span>
                    <div>
                      <p className="text-gold font-black text-xs uppercase tracking-wider mb-1">Pro Tip</p>
                      <p className="text-gold/90 text-sm italic">"{currentQ.explanation.tip}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Visual Section */}
              {currentQ.explanation.visual && (
                <div className="mb-6 rounded-lg overflow-hidden border border-slate-600 relative z-10 bg-black/50">
                  <img
                    src={currentQ.explanation.visual}
                    alt="Strategy Diagram"
                    className="w-full h-auto max-h-60 object-contain mx-auto"
                  />
                  <p className="text-[10px] text-center text-slate-500 py-1 bg-black/80 w-full">Visual Aid</p>
                </div>
              )}

              <div className="flex justify-end relative z-10">
                <button onClick={handleNext} className="px-8 py-3 rounded-lg bg-primary text-white font-bold shadow-lg hover:bg-blue-600 transition flex items-center gap-2">
                  {currentQuestionIndex + 1 === activeModule.questions.length ? 'Finish Quiz' : 'Next Question'}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Academia;
