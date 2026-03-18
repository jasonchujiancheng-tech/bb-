/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreHorizontal, 
  ChevronLeft
} from 'lucide-react';

// --- 类型定义 ---

interface Reaction {
  id: string;
  emoji: string;
  count: number;
  label: string;
  isReacted?: boolean;
}

interface Message {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: {
    type: 'image' | 'video' | 'audio' | 'text';
    url?: string;
    title?: string;
    subtitle?: string;
    duration?: string;
    text?: string;
  };
  reactions: Reaction[];
  isCommented?: boolean;
  commentCount?: number;
  timestamp: string;
}

/**
 * 粒子动画数据接口
 */
interface ParticleData {
  id: number;      // 唯一标识符
  x: number;       // 初始 X 坐标（相对于点击位置）
  y: number;       // 初始 Y 坐标（相对于点击位置）
  targetX: number; // 动画结束时的目标 X 偏移量
  targetY: number; // 动画结束时的目标 Y 偏移量
  emoji: string;   // 显示的表情符号
  isMain?: boolean; // 是否为主粒子（较大的那个）
}

// --- Components ---

const StatusBar = () => {
  return (
    <div className="flex items-center justify-between pl-[40px] pr-[12px] h-[47px] bg-[#F5F5F5] text-black select-none">
      <span className="text-[17px] font-bold">8:00</span>
      <div className="flex items-center gap-[5px]">
        <SignalIcon className="w-[22px] h-[13px]" />
        <WifiIcon className="w-[18px] h-[13px]" />
        <BatteryIcon className="w-[30px] h-[14px]" />
      </div>
    </div>
  );
};

/**
 * 普通散落粒子组件
 * 模拟 Telegram 点击表态时的碎屑飞散效果
 */
const Particle = ({ particle, onComplete }: { particle: ParticleData; onComplete: () => void }) => {
  return (
    <motion.div
      // 初始状态：透明且缩小
      initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
      // 动画过程
      animate={{ 
        opacity: [0, 1, 1, 0], // 渐入 -> 保持 -> 渐出
        scale: [0, 1.2, 1, 0], // 弹出 -> 略微缩小 -> 消失
        x: particle.targetX,   // 向目标 X 坐标移动
        y: particle.targetY    // 向目标 Y 坐标移动
      }}
      // 动画配置
      transition={{ 
        duration: 0.8,         // 持续 0.8 秒
        ease: "easeOut",       // 减速退出，效果更自然
        times: [0, 0.1, 0.7, 1] // 对应 animate 中数组各阶段的时间点
      }}
      onAnimationComplete={onComplete} // 动画结束后通知父组件移除该粒子
      className="absolute pointer-events-none z-50 text-sm"
      style={{ 
        left: '50%', 
        top: '50%', 
        marginLeft: '-7px', 
        marginTop: '-7px'
      }}
    >
      {particle.emoji}
    </motion.div>
  );
};

/**
 * 主弹出粒子组件
 * 模拟点击时中心那个较大的表情弹出并向上漂浮的效果
 */
const MainPop = ({ particle, onComplete }: { particle: ParticleData; onComplete: () => void }) => {
  return (
    <motion.div
      // 初始状态
      initial={{ scale: 0, opacity: 0, y: 0 }}
      // 动画过程
      animate={{ 
        scale: [0, 1.5, 1.2, 0], // 快速放大 -> 略微回弹 -> 缩小消失
        opacity: [0, 1, 1, 0],   // 渐入 -> 保持 -> 渐出
        y: particle.targetY      // 向上漂浮
      }}
      // 动画配置
      transition={{ 
        duration: 0.6,           // 持续 0.6 秒，比普通粒子稍快
        ease: "backOut",         // 带有回弹效果的插值函数
        times: [0, 0.2, 0.7, 1]
      }}
      onAnimationComplete={onComplete}
      className="absolute pointer-events-none z-50 text-2xl"
      style={{ 
        left: '50%', 
        top: '50%', 
        marginLeft: '-12px', 
        marginTop: '-12px'
      }}
    >
      {particle.emoji}
    </motion.div>
  );
};

const CommentIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_787_26994)">
      <path d="M5.08333 8.29174C5.56658 8.29174 5.95833 7.89998 5.95833 7.41674C5.95833 6.93349 5.56658 6.54174 5.08333 6.54174C4.60008 6.54174 4.20833 6.93349 4.20833 7.41674C4.20833 7.89998 4.60008 8.29174 5.08333 8.29174Z" fill="black"/>
      <path d="M8.875 7.41674C8.875 7.89998 8.48325 8.29174 8 8.29174C7.51675 8.29174 7.125 7.89998 7.125 7.41674C7.125 6.93349 7.51675 6.54174 8 6.54174C8.48325 6.54174 8.875 6.93349 8.875 7.41674Z" fill="black"/>
      <path d="M10.9167 8.29174C11.3999 8.29174 11.7917 7.89998 11.7917 7.41674C11.7917 6.93349 11.3999 6.54174 10.9167 6.54174C10.4334 6.54174 10.0417 6.93349 10.0417 7.41674C10.0417 7.89998 10.4334 8.29174 10.9167 8.29174Z" fill="black"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M8 1.87507C4.41416 1.87507 1.4375 4.18348 1.4375 7.2709C1.4375 10.2072 4.11766 12.2818 7.41667 12.5016V13.8334C7.41667 14.026 7.51171 14.2061 7.67065 14.3149C7.82959 14.4236 8.03195 14.4469 8.21143 14.3771C9.5907 13.8407 11.1544 12.8964 12.3824 11.6919C13.6025 10.4952 14.5625 8.96867 14.5625 7.2709C14.5625 4.18348 11.5858 1.87507 8 1.87507ZM2.60417 7.2709C2.60417 5.04258 4.82035 3.04174 8 3.04174C11.1796 3.04174 13.3958 5.04258 13.3958 7.2709C13.3958 8.52267 12.6788 9.76702 11.5655 10.859C10.6897 11.718 9.61259 12.4377 8.58333 12.9405V11.3542H8C4.79499 11.3542 2.60417 9.47905 2.60417 7.2709Z" fill="black"/>
    </g>
    <defs>
      <clipPath id="clip0_787_26994">
        <rect width="14" height="14" fill="white" transform="translate(1 1)"/>
      </clipPath>
    </defs>
  </svg>
);

const SmileIcon = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_787_27070)">
      <path d="M1.99996 8C1.99996 4.68629 4.68625 2 7.99996 2C11.2018 2 13.8179 4.50801 13.9909 7.66668C14.0009 7.8505 14.1492 8 14.3333 8H15C15.1841 8 15.3341 7.85044 15.3258 7.66652C15.1515 3.77121 11.9383 0.666664 7.99996 0.666664C3.94987 0.666664 0.666626 3.94991 0.666626 8C0.666626 11.9383 3.77117 15.1515 7.66649 15.3259C7.8504 15.3341 7.99996 15.1841 7.99996 15V14.3333C7.99996 14.1492 7.85046 14.001 7.66664 13.9909C4.50797 13.8179 1.99996 11.2019 1.99996 8Z" fill="black"/>
      <path d="M13.3333 12V10.3333C13.3333 10.1492 13.1841 10 13 10H12.3333C12.1492 10 12 10.1492 12 10.3333V12H10.3333C10.1492 12 9.99996 12.1492 9.99996 12.3333V13C9.99996 13.1841 10.1492 13.3333 10.3333 13.3333H12V15C12 15.1841 12.1492 15.3333 12.3333 15.3333H13C13.1841 15.3333 13.3333 15.1841 13.3333 15V13.3333H15C15.1841 13.3333 15.3333 13.1841 15.3333 13V12.3333C15.3333 12.1492 15.1841 12 15 12H13.3333Z" fill="black"/>
      <path d="M5.89996 7.4C6.39702 7.4 6.79996 6.86274 6.79996 6.2C6.79996 5.53726 6.39702 5 5.89996 5C5.4029 5 4.99996 5.53726 4.99996 6.2C4.99996 6.86274 5.4029 7.4 5.89996 7.4Z" fill="black"/>
      <path d="M10.1 7.4C10.597 7.4 11 6.86274 11 6.2C11 5.53726 10.597 5 10.1 5C9.6029 5 9.19996 5.53726 9.19996 6.2C9.19996 6.86274 9.6029 7.4 10.1 7.4Z" fill="black"/>
      <path d="M5.59996 9.00294C5.59996 9.9402 6.67448 11.3 7.99996 11.3C9.32544 11.3 10.4 9.9402 10.4 9.00294C10.4 8.06568 5.59996 8.06568 5.59996 9.00294Z" fill="black"/>
    </g>
    <defs>
      <clipPath id="clip0_787_27070">
        <rect width="16" height="16" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const BatteryIcon = ({ className }: { className?: string }) => (
  <svg width="25" height="12" viewBox="0 0 30 14" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <g clipPath="url(#clip0_1385_33340)">
      <rect opacity="0.4" x="0.538462" y="0.538462" width="25.8462" height="12.9231" rx="3.76923" stroke="black" strokeWidth="1.07692"/>
      <path opacity="0.5" d="M28 4.84616V9.15385C28.8679 8.78902 29.4323 7.9403 29.4323 7.00001C29.4323 6.05971 28.8679 5.211 28 4.84616Z" fill="black"/>
      <rect x="2.15381" y="2.15384" width="18.3077" height="9.69231" rx="2.15385" fill="black"/>
    </g>
    <defs>
      <clipPath id="clip0_1385_33340">
        <rect width="29.4323" height="14" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const WifiIcon = ({ className }: { className?: string }) => (
  <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path fillRule="evenodd" clipRule="evenodd" d="M6.28223 9.95884C7.75889 8.6798 9.92179 8.6798 11.3984 9.95884C11.4727 10.0276 11.5165 10.1249 11.5186 10.2274C11.5206 10.3299 11.4806 10.429 11.4092 10.5008L9.09669 12.8905C9.02902 12.9604 8.93695 12.9998 8.84083 12.9999C8.74452 12.9999 8.65175 12.9606 8.58399 12.8905L6.27149 10.5008C6.20011 10.429 6.16104 10.3299 6.16309 10.2274C6.16521 10.1249 6.208 10.0276 6.28223 9.95884ZM3.19727 6.77037C6.37861 3.74013 11.305 3.74014 14.4863 6.77037C14.5582 6.84144 14.5996 6.93958 14.6006 7.04185C14.6015 7.14403 14.5625 7.2428 14.4922 7.31529L13.1553 8.6981C13.0175 8.83919 12.7946 8.84239 12.6533 8.70494C11.6087 7.73625 10.2501 7.19908 8.84083 7.19908C7.43237 7.19968 6.07432 7.7368 5.03028 8.70494C4.88902 8.8424 4.66608 8.83922 4.52833 8.6981L3.19239 7.31529C3.12189 7.24289 3.08212 7.14409 3.08302 7.04185C3.08396 6.93955 3.12541 6.84143 3.19727 6.77037ZM0.111336 3.59166C4.99087 -1.19727 12.6888 -1.19716 17.5684 3.59166C17.639 3.66279 17.6791 3.75975 17.6797 3.86119C17.6803 3.96265 17.6421 4.06069 17.5723 4.13267L16.2334 5.51549C16.0956 5.65713 15.8724 5.65877 15.7324 5.51939C13.8734 3.70941 11.4059 2.70026 8.84083 2.70006C6.27536 2.70005 3.80761 3.70921 1.94825 5.51939C1.80833 5.65928 1.58407 5.65761 1.4463 5.51549L0.108406 4.13267C0.0386479 4.06064 -0.000636694 3.96264 7.80721e-06 3.86119C0.000659323 3.75977 0.0407069 3.66274 0.111336 3.59166Z" fill="black"/>
  </svg>
);

const SignalIcon = ({ className }: { className?: string }) => (
  <svg width="22" height="13" viewBox="0 0 22 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M2.48828 7.99805C3.17543 7.99805 3.7324 8.53564 3.73242 9.19824V11.5977C3.73242 12.2603 3.17545 12.7979 2.48828 12.7979H1.24414C0.557013 12.7978 0 12.2603 0 11.5977V9.19824C2.61216e-05 8.53567 0.557029 7.99809 1.24414 7.99805H2.48828ZM8.34375 5.59863C9.03087 5.59869 9.58789 6.13624 9.58789 6.79883V11.5977C9.58789 12.2602 9.03087 12.7978 8.34375 12.7979H7.09961C6.41244 12.7979 5.85547 12.2603 5.85547 11.5977V6.79883C5.85547 6.1362 6.41244 5.59863 7.09961 5.59863H8.34375ZM14.1992 2.7998C14.8861 2.8 15.4432 3.33666 15.4434 3.99902V11.5977C15.4434 12.2602 14.8862 12.7977 14.1992 12.7979H12.9551C12.2679 12.7979 11.71 12.2603 11.71 11.5977V3.99902C11.7101 3.33654 12.268 2.7998 12.9551 2.7998H14.1992ZM20.0537 0C20.7409 0 21.2979 0.537572 21.2979 1.2002V11.5977C21.2979 12.2603 20.7409 12.7979 20.0537 12.7979H18.8096C18.1224 12.7979 17.5654 12.2603 17.5654 11.5977V1.2002C17.5654 0.537572 18.1224 0 18.8096 0H20.0537Z" fill="black"/>
  </svg>
);

const BubbleTail = ({ className }: { className?: string }) => (
  <svg width="8" height="18" viewBox="0 0 4 9" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M0 6.05278C0 7.16545 0.901993 8.06744 2.01466 8.06744H4V3.57628e-06C4 1.23436 3.43011 2.39959 2.45576 3.15741L0.777786 4.46251C0.287033 4.8442 0 5.43108 0 6.05278Z" fill="white"/>
  </svg>
);

const ReactionButton = ({ 
  messageId,
  reaction, 
  onReact 
}: { 
  messageId: string;
  reaction: Reaction; 
  onReact: (messageId: string, emoji: string, rect: DOMRect, forceState?: boolean) => void 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (buttonRef.current) {
      onReact(messageId, reaction.emoji, buttonRef.current.getBoundingClientRect());
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
      onReact(messageId, reaction.emoji, buttonRef.current.getBoundingClientRect(), true);
    }
  };

  return (
    <motion.button
      ref={buttonRef}
      id={`reaction-btn-${messageId}-${reaction.emoji}`}
      whileTap={{ scale: 0.9 }}
      animate={reaction.isReacted ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={{ 
        duration: reaction.isReacted ? 0.2 : 0,
        times: [0, 0.5, 1]
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={`flex items-center gap-1.5 px-2 h-[28px] rounded-full relative border transition-all ${
        reaction.isReacted 
          ? 'bg-black/5 border-transparent duration-200' 
          : 'bg-[#F8F8F8] border-black/12 duration-0'
      }`}
    >
      <span className="text-sm">{reaction.emoji}</span>
      <span className="text-xs font-medium text-black transition-colors">{reaction.count}</span>
    </motion.button>
  );
};

const MessageCard: React.FC<{ 
  message: Message; 
  onReact: (messageId: string, emoji: string, rect: DOMRect, forceState?: boolean) => void;
  onDoubleClick: (id: string, rect: DOMRect) => void;
  onToggleComment: (id: string, forceState?: boolean) => void;
}> = ({ 
  message, 
  onReact,
  onDoubleClick,
  onToggleComment
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (bubbleRef.current) {
      const rect = bubbleRef.current.getBoundingClientRect();
      onDoubleClick(message.id, rect);
    }
  };

  return (
    <div className="mb-[10px] group">
      <div className="flex items-end gap-[8px]">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#db0007] flex items-center justify-center overflow-hidden border border-gray-100">
            <img 
              src={message.author.avatar} 
              alt={message.author.name} 
              className="w-6 h-6 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        <div className="flex-grow max-w-[85%] relative">
          <div 
            ref={bubbleRef}
            onDoubleClick={handleDoubleClick}
            className="relative z-10 cursor-pointer select-none active:scale-[0.98] transition-transform duration-75"
          >
            <div className="bg-white rounded-[5px_20px_20px_0px] overflow-hidden border border-gray-100">
              {message.content.text && (
                <div className="py-[10px] px-[12px] text-[15px] leading-relaxed text-gray-800">
                  {message.content.text}
                </div>
              )}
            </div>
            {/* Bubble Tail */}
            <BubbleTail className="absolute left-[-6px] bottom-[-0.2px] z-20" />
          </div>
        </div>
      </div>

      <div className="ml-[48px] flex flex-wrap gap-1.5 mt-2 items-center" id={`reactions-container-${message.id}`}>
          <motion.button 
            id={`comment-btn-${message.id}`}
            whileTap={{ scale: 0.9 }}
            animate={message.isCommented ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: message.isCommented ? 0.2 : 0 }}
            onClick={() => onToggleComment(message.id)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onToggleComment(message.id, true);
            }}
            className={`flex items-center gap-1.5 px-2 h-[28px] rounded-full border transition-all ${
              message.isCommented
                ? 'bg-black/5 border-transparent duration-200'
                : 'bg-[#F8F8F8] border-black/12 duration-0'
            }`}
          >
            <CommentIcon className="w-4 h-4" />
            <span className="text-xs font-medium text-black">
              {message.commentCount || 'Comment'}
            </span>
          </motion.button>
          
          <AnimatePresence initial={false}>
            {message.reactions.map((reaction) => (
              <motion.div
                key={reaction.id}
                initial={{ scale: 0, width: 0, opacity: 0 }}
                animate={{ scale: 1, width: 'auto', opacity: 1 }}
                exit={{ scale: 0, width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <ReactionButton messageId={message.id} reaction={reaction} onReact={onReact} />
              </motion.div>
            ))}
          </AnimatePresence>

          <button 
            id={`add-reaction-btn-${message.id}`}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const emojis = ['🩷', '🩵', '💛', '💚', '❤️', '🧡', '🔥', '😂', '😮', '🎉'];
              const emoji = emojis[Math.floor(Math.random() * emojis.length)];
              onReact(message.id, emoji, rect);
            }}
            className="px-2 h-[28px] rounded-full transition-colors border bg-[#F8F8F8] border-black/12 hover:bg-black/5 flex items-center justify-center"
          >
            <SmileIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

export default function App() {
  const reactionIdCounter = useRef(0);
  const particleIdCounter = useRef(0);
  const [particles, setParticles] = useState<ParticleData[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      author: {
        name: 'McDonald\'s',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/200px-McDonald%27s_Golden_Arches.svg.png'
      },
      content: {
        type: 'text',
        text: "At McDonald's, we're not just about great food. We're also committed to giving back to the community. Stay tuned for our upcoming community events and initiatives."
      },
      reactions: [
        { id: 'r1', emoji: '🍔', count: 4, label: 'burger' },
        { id: 'r2', emoji: '🍟', count: 1, label: 'fries' }
      ],
      timestamp: '8:05'
    },
    {
      id: '2',
      author: {
        name: 'McDonald\'s',
        avatar: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/200px-McDonald%27s_Golden_Arches.svg.png'
      },
      content: {
        type: 'text',
        text: "At McDonald's, we're not just about great food. We're also committed to giving back to the community. Stay tuned for our upcoming community events and initiatives."
      },
      reactions: [
        { id: 'r3', emoji: '🍔', count: 10700, label: 'burger' },
        { id: 'r4', emoji: '🍟', count: 8888, label: 'fries' }
      ],
      timestamp: '8:10'
    }
  ]);

  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleReact = useCallback((messageId: string, emoji: string, rect: DOMRect, forceState?: boolean) => {
    // 1. Determine animation state BEFORE updating messages using the ref
    const targetMsg = messagesRef.current.find(m => m.id === messageId);
    const existingReaction = targetMsg?.reactions.find(r => r.emoji === emoji);
    const currentIsReacted = !!existingReaction?.isReacted;
    const newIsReacted = forceState !== undefined ? forceState : !currentIsReacted;
    
    // We animate if we are turning a reaction ON
    const shouldAnimate = newIsReacted;

    // 2. Determine the origin point for particles
    let originX = rect.left + rect.width / 2;
    let originY = rect.top + rect.height / 2;

    // Try to find the specific button for this emoji first
    const specificBtn = document.getElementById(`reaction-btn-${messageId}-${emoji}`);
    if (specificBtn) {
      const btnRect = specificBtn.getBoundingClientRect();
      originX = btnRect.left + btnRect.width / 2;
      originY = btnRect.top + btnRect.height / 2;
    } else {
      // If specific button doesn't exist (new reaction), try the container
      const container = document.getElementById(`reactions-container-${messageId}`);
      if (container) {
        // Try to use the "Add Reaction" button as the origin for new reactions
        const addBtn = document.getElementById(`add-reaction-btn-${messageId}`);
        const commentBtn = document.getElementById(`comment-btn-${messageId}`);
        
        if (addBtn) {
          const addRect = addBtn.getBoundingClientRect();
          originX = addRect.left + addRect.width / 2;
          originY = addRect.top + addRect.height / 2;
        } else if (commentBtn) {
          const commentRect = commentBtn.getBoundingClientRect();
          originX = commentRect.left + commentRect.width / 2;
          originY = commentRect.top + commentRect.height / 2;
        } else {
          const containerRect = container.getBoundingClientRect();
          originX = containerRect.left + 20;
          originY = containerRect.top + containerRect.height / 2;
        }
      }
    }

    // 3. Update message state
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        const reaction = msg.reactions.find(r => r.emoji === emoji);
        if (reaction) {
          const stateChanged = currentIsReacted !== newIsReacted;
          const newCount = stateChanged 
            ? (newIsReacted ? reaction.count + 1 : Math.max(0, reaction.count - 1))
            : reaction.count;

          if (newCount === 0 && !newIsReacted) {
            return {
              ...msg,
              reactions: msg.reactions.filter(r => r.emoji !== emoji)
            };
          }
          
          return {
            ...msg,
            reactions: msg.reactions.map(r => {
              if (r.emoji === emoji) {
                return {
                  ...r,
                  isReacted: newIsReacted,
                  count: newCount
                };
              }
              return r;
            })
          };
        } else {
          return {
            ...msg,
            reactions: [...msg.reactions, {
              id: `react-${Date.now()}-${reactionIdCounter.current++}`,
              emoji,
              count: 1,
              label: 'reaction',
              isReacted: true
            }]
          };
        }
      }
      return msg;
    }));

    // 4. 触发粒子动画
    if (shouldAnimate) {
      const newParticles: ParticleData[] = [];

      // 创建主弹出粒子（中心较大的那个）
      newParticles.push({ 
        id: particleIdCounter.current++, 
        x: originX, 
        y: originY, 
        targetX: 0,
        targetY: -40, // 向上漂浮 40px
        emoji, 
        isMain: true 
      });

      // 创建散落的小粒子（周围飞散的碎屑）
      for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2; // 随机发射角度
        const distance = 30 + Math.random() * 40;  // 随机发射距离
        newParticles.push({
          id: particleIdCounter.current++,
          x: originX,
          y: originY,
          targetX: Math.cos(angle) * distance,      // 根据角度计算 X 偏移
          targetY: Math.sin(angle) * distance - 40, // 根据角度计算 Y 偏移，并整体向上偏移
          emoji
        });
      }

      // 将新粒子添加到状态中，触发渲染
      setParticles(prev => [...prev, ...newParticles]);
    }
  }, []);

  const handleDoubleClick = useCallback((id: string, rect: DOMRect) => {
    const emojis = ['🩷', '🩵', '💛', '💚', '❤️', '🧡'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Force state to true on double click
    handleReact(id, emoji, rect, true);
  }, [handleReact]);

  const handleToggleComment = useCallback((id: string, forceState?: boolean) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === id) {
        const currentIsCommented = !!msg.isCommented;
        const newIsCommented = forceState !== undefined ? forceState : !currentIsCommented;
        
        if (currentIsCommented === newIsCommented) return msg;

        return {
          ...msg,
          isCommented: newIsCommented,
          commentCount: newIsCommented 
            ? (msg.commentCount || 0) + 1 
            : Math.max(0, (msg.commentCount || 0) - 1)
        };
      }
      return msg;
    }));
  }, []);

  const removeParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-[390px] h-[844px] bg-[#F5F5F5] font-sans text-gray-900 overflow-hidden relative shadow-2xl border-[8px] border-black rounded-[50px] flex flex-col">
        <div className="sticky top-0 z-30 bg-[#F5F5F5]">
        <StatusBar />
        
        {/* Header */}
        <header className="flex items-center justify-between px-[12px] h-[56px] bg-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#db0007] flex items-center justify-center overflow-hidden">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/McDonald%27s_Golden_Arches.svg/200px-McDonald%27s_Golden_Arches.svg.png" 
                  alt="Mcd" 
                  className="w-6 h-6 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="font-bold text-base">big family</h1>
                <p className="text-xs text-gray-500">1.3M members</p>
              </div>
            </div>
          </div>
          <MoreHorizontal className="w-6 h-6 text-black" />
        </header>
      </div>

      {/* Chat Area */}
      <main className="flex-grow overflow-y-auto px-[12px] py-6 bg-[#F5F5F5]">
        <div className="max-w-2xl mx-auto">
          {messages.map(msg => (
            <MessageCard 
              key={msg.id} 
              message={msg} 
              onReact={handleReact} 
              onDoubleClick={handleDoubleClick}
              onToggleComment={handleToggleComment}
            />
          ))}
        </div>
      </main>

      {/* Particles Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map(p => (
          <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y }}>
            {p.isMain ? (
              <MainPop particle={p} onComplete={() => removeParticle(p.id)} />
            ) : (
              <Particle particle={p} onComplete={() => removeParticle(p.id)} />
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
);
}
