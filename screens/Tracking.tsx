
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Play, Pause, Square, Plus, Trash2, X, Briefcase, Code, Book, Dumbbell, Zap, Coffee, PenTool, Music, Globe, Camera, Gamepad2, Heart } from 'lucide-react';
import { storage } from '../services/storage';
import { STORAGE_KEYS, TOPIC_COLORS, TOPIC_ICONS } from '../constants';

const ICON_MAP: Record<string, any> = {
  'briefcase': Briefcase,
  'code': Code,
  'book': Book,
  'dumbbell': Dumbbell,
  'zap': Zap,
  'coffee': Coffee,
  'pen-tool': PenTool,
  'music': Music,
  'globe': Globe,
  'camera': Camera,
  'gamepad-2': Gamepad2,
  'heart': Heart,
};

const formatDuration = (totalMinutes: number) => {
    const totalSeconds = Math.floor(totalMinutes * 60);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
};

export const Tracking = () => {
  const { user } = useAuth();
  const { 
    topics, activeTopicId, timerState, elapsedSeconds,
    addTopic, updateTopic, addManualMinutes, deleteTopic, selectTopic, startTimer, pauseTimer, stopTimer, resumeTimer 
  } = useData();

  const [isAdding, setIsAdding] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('zap');
  
  // Delete Modal State
  const [topicToDelete, setTopicToDelete] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  // Edit Topic Modal State
  const [topicToEditId, setTopicToEditId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState('zap');
  const [editColor, setEditColor] = useState(TOPIC_COLORS[0]);
  const [manualMinutesToAdd, setManualMinutesToAdd] = useState('');

  useEffect(() => {
    if (user) {
        // Load preference for current user
        const skip = storage.getForUser<boolean>(user.id, STORAGE_KEYS.SKIP_DELETE_CONFIRM, false);
        setDontAskAgain(skip);
    }
  }, [user]);

  const formatTimerDisplay = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  };

  const handleAddTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTopicName.trim()) {
      addTopic(newTopicName, selectedIcon);
      setNewTopicName('');
      setSelectedIcon('zap');
      setIsAdding(false);
    }
  };

  const openEditModal = (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    setTopicToEditId(topicId);
    setEditName(topic.name);
    setEditIcon(topic.icon || 'zap');
    setEditColor(topic.color);
    setManualMinutesToAdd('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setTopicToEditId(null);
    setManualMinutesToAdd('');
  };

  const saveTopicEdits = () => {
    if (!topicToEditId) return;
    const name = editName.trim();
    if (!name) return;
    updateTopic(topicToEditId, { name, icon: editIcon, color: editColor });

    const minutes = Number(manualMinutesToAdd);
    if (Number.isFinite(minutes) && minutes > 0) {
      addManualMinutes(topicToEditId, minutes);
    }

    closeEditModal();
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    if (!user) return;

    // Check if user previously opted to skip confirmation
    const skip = storage.getForUser<boolean>(user.id, STORAGE_KEYS.SKIP_DELETE_CONFIRM, false);
    
    if (skip) {
        deleteTopic(id);
    } else {
        setTopicToDelete(id);
        setShowDeleteModal(true);
    }
  };

  const confirmDelete = () => {
    if (topicToDelete && user) {
        deleteTopic(topicToDelete);
        
        // Save preference if checked
        if (dontAskAgain) {
            storage.setForUser(user.id, STORAGE_KEYS.SKIP_DELETE_CONFIRM, true);
        }
        
        setShowDeleteModal(false);
        setTopicToDelete(null);
    }
  };

  const activeTopic = topics.find(t => t.id === activeTopicId);
  const ActiveIcon = activeTopic ? (ICON_MAP[activeTopic.icon || 'zap'] || Zap) : null;
  const topicToDeleteName = topics.find(t => t.id === topicToDelete)?.name;

  return (
    <>
    <div className="flex flex-col h-full pb-32 animate-slide-up px-1">
      <div className="flex justify-between items-center mb-8 pt-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-white">Tracking</h1>
      </div>

      <div className={`
        relative overflow-hidden rounded-2xl p-8 mb-8 text-center transition-all duration-500
        ${activeTopicId 
            ? 'bg-[#1C1C1E] border border-white/10 shadow-2xl' 
            : 'bg-[#1C1C1E]/50 border border-white/5 border-dashed'}
        ${timerState === 'running' 
            ? 'shadow-[0_0_60px_-20px_rgba(0,122,255,0.4)] border-[#007AFF]/30' 
            : ''}
      `}>
        <div className="relative z-10 flex flex-col items-center">
          {/* Badge Display for Active Topic */}
          {activeTopic ? (
            <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8 backdrop-blur-md transition-all duration-300"
                style={{
                    backgroundColor: `${activeTopic.color}15`, // very low opacity background
                    borderColor: `${activeTopic.color}30`,
                    color: activeTopic.color,
                    boxShadow: `0 0 20px -5px ${activeTopic.color}30`
                }}
            >
                {ActiveIcon && <ActiveIcon size={14} strokeWidth={3} />}
                <span className="text-[13px] font-bold uppercase tracking-wider">{activeTopic.name}</span>
            </div>
          ) : (
            <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
                 <span className="text-[13px] font-bold text-textSecondary uppercase tracking-wider">Select a Topic</span>
            </div>
          )}
          
          <div className={`text-[56px] sm:text-[64px] font-medium font-mono tracking-tighter mb-10 tabular-nums leading-none transition-colors ${activeTopicId ? 'text-white' : 'text-white/20'}`}>
            {formatTimerDisplay(elapsedSeconds)}
          </div>

          <div className="flex justify-center gap-6 h-16 items-center">
             {!activeTopicId ? (
                <div className="text-textSecondary text-[15px] font-medium animate-pulse">Choose a topic below</div>
             ) : (
                 <>
                    {/* Play/Pause Button - Kept round as they are playback controls */}
                    {timerState === 'running' ? (
                        <button onClick={pauseTimer} className="w-16 h-16 rounded-full bg-[#FF9F0A] flex items-center justify-center text-white shadow-lg shadow-orange-500/20 active:scale-95 transition-transform animate-fade-in">
                            <Pause fill="currentColor" size={28} />
                        </button>
                    ) : (
                         <button onClick={startTimer} className="w-16 h-16 rounded-full bg-[#34C759] flex items-center justify-center text-white shadow-lg shadow-green-500/20 active:scale-95 transition-transform animate-fade-in">
                            <Play fill="currentColor" className="ml-1" size={28}/>
                        </button>
                    )}
                    
                    {/* Stop Button */}
                    {(timerState !== 'idle' || elapsedSeconds > 0) && (
                        <button onClick={stopTimer} className="w-16 h-16 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[#FF453A] border border-[#FF453A]/30 active:scale-95 transition-transform animate-fade-in">
                            <Square fill="currentColor" size={24}/>
                        </button>
                    )}
                 </>
             )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 px-1">
        <h2 className="font-heading font-bold text-xl text-white tracking-tight">Topics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-4">
        {topics.map(topic => {
          const isActive = activeTopicId === topic.id;
          const IconComponent = ICON_MAP[topic.icon || 'zap'] || Zap;
          
          // Calculate real-time display duration
          const displayTotalMinutes = isActive 
            ? topic.totalMinutes + (elapsedSeconds / 60) 
            : topic.totalMinutes;

          return (
             <Card 
                key={topic.id} 
                onClick={() => {
                    if (timerState === 'idle') {
                        selectTopic(topic.id);
                    }
                }}
                className={`
                    relative group transition-all duration-300 min-h-[140px] flex flex-col justify-between p-5
                    ${isActive ? 'ring-[3px] ring-[#007AFF] bg-[#2C2C2E]' : 'bg-[#1C1C1E]'}
                    ${timerState !== 'idle' && !isActive ? 'opacity-30 pointer-events-none grayscale' : ''}
                    ${timerState === 'idle' ? 'hover:bg-[#2C2C2E] cursor-pointer' : ''}
                `}
             >
                <div className="flex justify-between items-start mb-2">
                    <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105" 
                        style={{backgroundColor: topic.color}}
                    >
                        <IconComponent size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    {timerState === 'idle' && (
                        <button 
                           onClick={(e) => initiateDelete(e, topic.id)}
                           className="text-[#8E8E93] hover:text-[#FF453A] -mt-2 -mr-2 p-2 transition-colors"
                        >
                            <Trash2 size={20} />
                        </button>
                   )}
                </div>
                
                <div>
                    <div className="font-bold text-[17px] truncate text-white leading-tight mb-1.5 tracking-tight">{topic.name}</div>
                    <div className="text-[13px] text-[#8E8E93] font-medium tabular-nums">
                        {formatDuration(displayTotalMinutes)}
                    </div>
                </div>

                <button
                    onClick={(e) => openEditModal(e, topic.id)}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-[#2C2C2E] border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-[#3A3A3C] active:scale-95 transition-all"
                    aria-label="Edit topic"
                    type="button"
                >
                    <PenTool size={18} />
                </button>
             </Card>
          );
        })}
        
        {/* Add Topic Button Card */}
        <div 
            onClick={() => setIsAdding(true)}
            className="min-h-[140px] rounded-2xl border-2 border-dashed border-[#2C2C2E] flex flex-col items-center justify-center cursor-pointer hover:bg-[#2C2C2E]/30 hover:border-[#3A3A3C] active:bg-[#2C2C2E]/50 transition-all active:scale-[0.98] group"
        >
            <div className="w-12 h-12 rounded-full bg-[#2C2C2E] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm group-hover:bg-[#3A3A3C]">
                <Plus size={24} className="text-[#007AFF]" strokeWidth={3} />
            </div>
            <span className="text-[15px] font-medium text-[#8E8E93] group-hover:text-white transition-colors">Create New</span>
        </div>
      </div>
    </div>

    {/* Add Topic Modal */}
    {isAdding && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
            onClick={() => setIsAdding(false)} 
        />
        <div className="relative bg-[#1C1C1E] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scale-press border border-white/10 p-6 flex flex-col space-y-6">
            
            {/* Header */}
            <div className="text-center">
                <h3 className="font-heading text-2xl font-bold text-white mb-1">New Topic</h3>
                <p className="text-[15px] text-textSecondary">What are you focusing on?</p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddTopic} className="space-y-6">
                <div className="space-y-4">
                     {/* Name Input */}
                    <div className="bg-[#2C2C2E] rounded-2xl px-2 py-1">
                        <input 
                            autoFocus
                            placeholder="Topic Name (e.g., Coding)" 
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            className="w-full bg-transparent text-white text-[17px] placeholder-[#8E8E93] h-12 px-4 border-none outline-none font-medium text-center"
                        />
                    </div>
                    
                    {/* Icon Picker */}
                    <div>
                        <label className="text-[13px] text-textSecondary font-medium mb-3 block text-center">Choose Icon</label>
                        <div className="flex flex-wrap justify-center gap-3">
                            {TOPIC_ICONS.map(icon => {
                                const IconComp = ICON_MAP[icon];
                                const isSelected = selectedIcon === icon;
                                return (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setSelectedIcon(icon)}
                                        className={`
                                            w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200
                                            ${isSelected ? 'bg-white text-black scale-110 shadow-lg' : 'bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C]'}
                                        `}
                                    >
                                        <IconComp size={20} strokeWidth={2.5} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-2">
                    <Button 
                        type="submit" 
                        fullWidth 
                        disabled={!newTopicName.trim()}
                        className="bg-[#007AFF] hover:bg-[#0069D9] text-white shadow-lg shadow-blue-500/20"
                    >
                        Create Topic
                    </Button>
                    <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => setIsAdding(false)} 
                        fullWidth
                        className="text-[#FF453A] hover:bg-[#FF453A]/10"
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDeleteModal(false)} />
            <div className="relative bg-[#1C1C1E] w-full max-w-[320px] rounded-2xl p-6 flex flex-col items-center shadow-2xl animate-scale-press border border-white/10">
                
                <div className="w-16 h-16 rounded-full bg-[#FF453A]/10 flex items-center justify-center mb-5 text-[#FF453A] ring-1 ring-[#FF453A]/20">
                    <Trash2 size={32} strokeWidth={2} />
                </div>

                <h3 className="font-heading text-xl font-bold text-white mb-2 text-center">Delete Topic?</h3>
                
                <p className="text-[15px] text-textSecondary text-center leading-relaxed mb-6 px-2">
                    Are you sure you want to delete <span className="text-white font-semibold">"{topicToDeleteName}"</span>? All session history will be lost.
                </p>

                {/* Toggle Switch for "Don't ask again" */}
                <div 
                    onClick={() => setDontAskAgain(!dontAskAgain)}
                    className="flex items-center justify-between w-full bg-[#2C2C2E] px-4 py-3 rounded-2xl mb-8 cursor-pointer active:scale-[0.99] transition-transform"
                >
                    <span className="text-[15px] font-medium text-white">Don't ask again</span>
                    <div className={`
                        w-[51px] h-[31px] rounded-full p-[2px] transition-colors duration-300 relative
                        ${dontAskAgain ? 'bg-[#34C759]' : 'bg-[#3A3A3C]'}
                    `}>
                         <div className={`
                            w-[27px] h-[27px] bg-white rounded-full shadow-md transition-transform duration-300 cubic-bezier(0.4, 0.0, 0.2, 1)
                            ${dontAskAgain ? 'translate-x-[20px]' : 'translate-x-0'}
                        `} />
                    </div>
                </div>
                
                <div className="w-full space-y-3">
                    <Button 
                        onClick={confirmDelete}
                        variant="danger"
                        fullWidth
                        className="shadow-lg shadow-red-500/20"
                    >
                        Delete Forever
                    </Button>
                    <Button 
                        onClick={() => setShowDeleteModal(false)}
                        variant="ghost"
                        fullWidth
                        className="text-white hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    )}

    {/* Edit Topic Modal */}
    {showEditModal && topicToEditId && (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={closeEditModal}
        />
        <div className="relative bg-[#1C1C1E] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-scale-press border border-white/10 p-6 flex flex-col space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-xl font-bold text-white">Edit Topic</h3>
            <button onClick={closeEditModal} className="p-2 -mr-2 text-[#8E8E93] hover:text-white transition-colors" type="button">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-[#2C2C2E] rounded-2xl px-2 py-1">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-transparent text-white text-[17px] placeholder-[#8E8E93] h-12 px-4 border-none outline-none font-medium"
                placeholder="Topic Name"
              />
            </div>

            <div>
              <label className="text-[13px] text-textSecondary font-medium mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_ICONS.map(icon => {
                  const IconComp = ICON_MAP[icon];
                  const isSelected = editIcon === icon;
                  return (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setEditIcon(icon)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${isSelected ? 'bg-white text-black scale-110 shadow-lg' : 'bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3A3A3C]'}`}
                    >
                      <IconComp size={18} strokeWidth={2.5} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[13px] text-textSecondary font-medium mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_COLORS.map(color => {
                  const isSelected = editColor === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditColor(color)}
                      className={`w-9 h-9 rounded-full border transition-all ${isSelected ? 'ring-2 ring-white/80 border-white/30 scale-110' : 'border-white/10'}`}
                      style={{ backgroundColor: color }}
                      aria-label="Select color"
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[13px] text-textSecondary font-medium block">Add Minutes</label>
              <div className="flex flex-col gap-2">
                <input
                  value={manualMinutesToAdd}
                  onChange={(e) => setManualMinutesToAdd(e.target.value)}
                  inputMode="numeric"
                  className="flex-1 bg-[#2C2C2E] rounded-2xl h-12 px-4 text-white outline-none"
                  placeholder="e.g. 30"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <Button type="button" fullWidth onClick={saveTopicEdits} disabled={!editName.trim()}>
              Save Changes
            </Button>
            <Button type="button" variant="ghost" fullWidth onClick={closeEditModal} className="text-[#8E8E93] hover:text-white">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
