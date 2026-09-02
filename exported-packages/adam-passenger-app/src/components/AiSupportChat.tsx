import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../stateEngine';
import { Send, Sparkles, AlertCircle, RefreshCw, Smartphone, Key, Coins, HeartHandshake, CheckCircle } from 'lucide-react';

interface AiSupportChatProps {
  userType: 'driver' | 'passenger';
  userId: string;
  userName: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  commandsExecuted?: string[];
}

export const AiSupportChat: React.FC<AiSupportChatProps> = ({ userType, userId, userName }) => {
  const { 
    addWalletTransaction, 
    drivers, 
    passengers, 
    rides, 
    requests,
    cancelIntraCityRide,
    cancelRideRequest,
    language,
    activeCountry
  } = useAppState();

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: language === 'en' 
        ? `Hello ${userName}! Welcome to Adam's AI technical support. I can immediately refund your wallet balance or resolve stuck trip issues. Inform me of any problems you faced, and I will handle it.`
        : `أهلاً بك يا ${userName}! في واجهة الدعم الفني الذكي لقوافل ومستخدمي آدم 🤖✨. أنا وكيل الدعم الفوري المعتمد لحسابك، ومخول بمساعدتك فورياً في شحن واسترداد الرصيد التائه أو حل مشاكل الرحلات العالقة. اسرد لي مشكلتك وسأتصرف فوراً عنك!`,
      timestamp: new Date().toLocaleTimeString('ar-JO', { hour: 'numeric', minute: '2-digit' })
    }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active state context
  const currentUser = userType === 'driver' 
    ? drivers.find(d => d.id === userId)
    : passengers.find(p => p.id === userId);

  const activeRideId = currentUser?.activeRideId || null;
  const userBalance = currentUser?.balance || 0;
  const activeRideObj = activeRideId ? rides.find(r => r.id === activeRideId) : null;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currency = language === 'en' ? (activeCountry?.currencyEn || 'JOD') : (activeCountry?.currencyAr || 'د.أ');

  // Trigger chips for rapid support
  const quickChips = userType === 'driver' ? [
    { label: '💰 استرداد عمولة ملغاة', text: 'أريد استرداد د.أ عمولة الرحلة الأخيرة التي أُلغيت بسبب تأخر الراكب' },
    { label: '🚨 إلغاء طلب توصيل عالق', text: 'لدي مشكلة في التطبيق، الرحلة عالقة مع الراكب وأريد إنهاءها أو إلغاءها' },
    { label: '📊 فحص حالة رصيدي الآن', text: 'هل رصيد محفظتي مناسب للعمل؟ يرجى فحص رصيدي وإعطائي نصيحة' },
    { label: '🔧 مشكلة عدم تلقي رحلات', text: 'أنا متصل بالإنترنت ولكن لا تصلني أي طلبات مشاوير فورية، ما الخلل؟' }
  ] : [
    { label: '💰 استرداد رصيد مشوار ملغى', text: 'أريد استرداد رصيد المشوار الأخير الذي دفعته بالمحفظة وتم إلغاؤه' },
    { label: '🚨 فك تعليق طلبي الحالي', text: 'طلبي معلق وعالق وتأخر الكابتن، أريد إلغاء المشوار فوراً دون غرامة' },
    { label: '💳 الاستفسار عن عمولة النظام', text: 'كيف يتم احتساب كلفة الرحلات التشاركية؟ يرجى إرشادي لكيفية التوفير' },
    { label: '📱 خلل في الخرائط والجغرافي', text: 'موقع السائق لا يتحرك على خريطتي، هل هناك مشكلة تقنية؟' }
  ];

  // Execute commands extracted from AI response
  const handleExecuteCommands = (commands: any[]): string[] => {
    const executedLogs: string[] = [];
    commands.forEach((cmd) => {
      try {
        if (cmd.action === 'refund_balance') {
          const amt = Number(cmd.amount) || 2.0;
          const reason = cmd.reason || 'تعويض مستعجل من وكيل الدعم الفني الذكي';
          // Call the state transaction logic
          addWalletTransaction(userId, userType, 'deposit', amt, `🎁 ${reason}`);
          executedLogs.push(language === 'en' 
            ? `Successfully refunded ${amt.toFixed(2)} ${currency} to your wallet!`
            : `✅ تم تسوية واسترداد رصيد مالي بقيمة ${amt.toFixed(2)} ${currency} لداخل محفظتك!`);
        } 
        else if (cmd.action === 'cancel_active_ride') {
          if (activeRideId) {
            cancelIntraCityRide(activeRideId, userType);
            executedLogs.push(language === 'en'
              ? `Cancelled stuck ride #${activeRideId.split('_').pop()}`
              : `✅ تم تصفير وإلغاء المشوار العالق #${activeRideId.split('_').pop()} بنجاح!`);
          } else {
            // Check if there is an active ride request pending
            const pendingReq = requests.find(r => r.passengerId === userId && r.status === 'pending');
            if (pendingReq) {
              cancelRideRequest(userId);
              executedLogs.push(language === 'en'
                ? `Cancelled pending ride request`
                : `✅ تم تصفير وحذف طلب التوصيل المعلق الخاص بك!`);
            } else {
              executedLogs.push(language === 'en'
                ? `No active stuck requests found to cancel.`
                : `🔍 فحصنا النظام ولم نجد مشواراً عالقاً في حسابك حالياً.`);
            }
          }
        }
      } catch (err: any) {
        console.error("Error executing support command:", err);
        executedLogs.push(`⚠️ خلل تشغيلي: ${err.message}`);
      }
    });
    return executedLogs;
  };

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    // Add user message
    const timestampStr = new Date().toLocaleTimeString('ar-JO', { hour: 'numeric', minute: '2-digit' });
    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: timestampStr
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    // Filter message histories
    const history = messages.slice(-6).map(m => ({
      sender: m.sender,
      message: m.text
    }));

    try {
      const response = await fetch('/api/ai-technical-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: userType,
          senderId: userId,
          senderName: userName,
          latestMessage: textToSend,
          messageHistory: history,
          systemContext: {
            userBalance,
            activeRideId
          }
        })
      });

      const data = await response.json();
      if (data && data.success) {
        let aiText = data.text || '';
        
        // Parse console commands if embedded
        let logs: string[] = [];
        const match = aiText.match(/```console-commands\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          try {
            const commands = JSON.parse(match[1]);
            logs = handleExecuteCommands(commands);
            // Clean code blocks from displayed text to keep clean professional user view
            aiText = aiText.replace(/```console-commands[\s\S]*?```/, '').trim();
          } catch (cmdErr) {
            console.error("Failed executing parsed commands:", cmdErr);
          }
        }

        const aiMsg: Message = {
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString('ar-JO', { hour: 'numeric', minute: '2-digit' }),
          commandsExecuted: logs.length > 0 ? logs : undefined
        };

        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error(data.msg || 'Failed generating responsive support content');
      }
    } catch (err: any) {
      console.error("Support assistant error:", err);
      // Fallback
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: `معذرة من العميل ${userName}، تعطل الإرسال بسبب مشكلة اتصال بالسحابة. يمكنك إعادة كتابة طلبك أو النقر فوق الخيار لتلقي المساعدة التلقائية.`,
        timestamp: new Date().toLocaleTimeString('ar-JO', { hour: 'numeric', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-support-agent" className="flex-1 flex flex-col bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden font-sans h-full shadow-2xl relative">
      {/* Super Header with Sparkles & Live Pulsing Indicator */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-slate-950 p-3 border-b border-indigo-900/40 flex items-center justify-between flex-row-reverse">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="p-1 px-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/25">
            <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
          </div>
          <div className="text-right">
            <h4 className="text-[11.5px] font-black text-slate-100 uppercase tracking-wide">وكيل الدعم الفني وآيزان آدم-AI</h4>
            <span className="text-[9px] text-indigo-400 block font-semibold leading-none mt-0.5">مساعد استرداد الأرصدة وحل المشاكل الفورية 🤖</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-900/60 p-1 px-2 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[8.5px] text-slate-300 font-mono">Gemini 3.5 Active</span>
        </div>
      </div>

      {/* Account brief stats widget in support panel */}
      <div className="bg-slate-900/40 border-b border-slate-850 px-3.5 py-1.5 flex justify-between items-center text-[10px] flex-row-reverse text-slate-300">
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span>الرصيد الفعلي:</span>
          <span className="text-emerald-400 font-extrabold font-mono">{userBalance.toFixed(2)} {currency}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-row-reverse">
          <span>نشاط الرحلة:</span>
          {activeRideId ? (
            <span className="px-1.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-900/40 rounded text-[8.5px] font-bold">رحلة معلقة جارية 🚕</span>
          ) : (
            <span className="text-slate-500 italic">لا يوجد مشاور نشط</span>
          )}
        </div>
      </div>

      {/* Messages layout pane */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 h-[250px] bg-slate-950/80">
        {messages.map((m, i) => {
          const isUser = m.sender === 'user';
          return (
            <div key={i} className={`flex flex-col max-w-[85%] ${isUser ? 'self-end' : 'self-start'} gap-1`}>
              <div className={`p-2.5 rounded-2xl ${
                isUser 
                  ? 'bg-gradient-to-br from-indigo-700 to-indigo-800 text-slate-100 rounded-tr-none' 
                  : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none'
              } text-right text-xs shadow-md leading-relaxed whitespace-pre-wrap`}>
                <p className="font-sans line-clamp-none select-all">{m.text}</p>
                
                {/* Embedded automatic command logs execution showcase */}
                {m.commandsExecuted && (
                  <div className="mt-2.5 bg-slate-950/90 border border-emerald-900/30 p-2 rounded-xl flex flex-col gap-1.5 text-right font-sans animate-fadeIn">
                    <span className="text-[8.5px] text-slate-400 font-bold block border-b border-slate-900 pb-1 flex items-center justify-end gap-1 flex-row-reverse">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      إجراءات آدم التقنية الذاتية الفورية:
                    </span>
                    {m.commandsExecuted.map((log, idx) => (
                      <span key={idx} className="text-[9.5px] text-emerald-400 font-medium font-sans">
                        {log}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className={`text-[8px] text-slate-500 px-1 ${isUser ? 'text-left' : 'text-right'}`}>
                {isUser ? userName : 'وكيل الدعم الذكي'} • {m.timestamp}
              </span>
            </div>
          );
        })}

        {loading && (
          <div className="self-start flex flex-col gap-1 max-w-[80%]">
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none text-right text-xs text-slate-300 flex items-center gap-2 flex-row-reverse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              <span className="animate-pulse text-[9.5px] text-indigo-300 font-black">جاري مراجعة طلبك بموجب معايير الإشراف المالي لآدم...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Chips Box */}
      <div className="bg-slate-900/20 px-3 py-1.5 border-t border-slate-850">
        <span className="text-[8.5px] text-indigo-400/85 block text-right font-bold tracking-wide mb-1 flex items-center justify-end gap-1 flex-row-reverse">
          <RefreshCw className="w-3 h-3 text-indigo-400" />
          مفاتيح استرداد ومساعدة سريعة:
        </span>
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none flex-row-reverse">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => sendMessage(chip.text)}
              className="whitespace-nowrap px-2.5 py-1 bg-slate-900/90 hover:bg-indigo-950 hover:text-indigo-300 border border-slate-850 hover:border-indigo-900/60 text-slate-350 text-[9px] rounded-full transition-all duration-200 select-none cursor-pointer"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Inputs Footer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(inputVal);
        }}
        className="p-2 bg-slate-900 border-t border-slate-850 flex gap-1.5"
      >
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className={`p-1 px-3.5 rounded-xl text-white text-xs flex items-center justify-center transition-all ${
            loading || !inputVal.trim() 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={loading}
          placeholder={language === 'en' ? "Describe your issue for instant action..." : "اكتب مشكلتك بدقة للحصول على استرداد أو إلغاء فوري..."}
          className="bg-slate-950 text-xs text-slate-100 p-2 px-3 rounded-xl flex-1 outline-none text-right placeholder-slate-600 border border-slate-850 focus:border-indigo-600 transition-all font-sans"
        />
      </form>
    </div>
  );
};
