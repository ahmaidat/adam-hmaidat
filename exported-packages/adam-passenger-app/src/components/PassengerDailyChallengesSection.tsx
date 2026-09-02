import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Gift, 
  ShieldCheck, 
  Star, 
  Flame, 
  Percent, 
  RefreshCw,
  Coins,
  Ticket
} from 'lucide-react';

interface PassengerDailyChallengesSectionProps {
  loggedPassenger: any;
  rides: any[];
  scheduledTrips?: any[];
  intraCityRides?: any[];
  walletTransactions: any[];
  settings?: any;
  claimChallengeReward?: (userId: string, role: string, offerId: string) => { success: boolean; msg: string };
  addWalletTransaction?: (userId: string, userType: 'driver' | 'passenger' | 'admin', type: any, amount: number, description: string, status?: string, transactionId?: string, paymentMethod?: string) => any;
  saveState?: (newState: any) => void;
}

export const PassengerDailyChallengesSection: React.FC<PassengerDailyChallengesSectionProps> = ({
  loggedPassenger,
  rides = [],
  scheduledTrips = [],
  intraCityRides = [],
  walletTransactions = [],
  settings,
  claimChallengeReward,
  addWalletTransaction,
}) => {
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemStatusMsg, setRedeemStatusMsg] = useState('');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  if (!loggedPassenger) return null;

  // Calculate passenger's completed rides
  const completedIntercityRides = rides.filter(
    r => (r.passengerId === loggedPassenger.id || r.passengerPhone === loggedPassenger.phone) && r.status === 'completed'
  );
  const completedIntraCityRides = (intraCityRides || []).filter(
    r => (r.passengerId === loggedPassenger.id || r.passengerPhone === loggedPassenger.phone) && r.status === 'completed'
  );
  const completedScheduledTrips = (scheduledTrips || []).filter(
    t => (t.passengerIds?.includes(loggedPassenger.id) || t.passengerPhone === loggedPassenger.phone) && t.status === 'completed'
  );

  const totalCompletedTrips = completedIntercityRides.length + completedIntraCityRides.length + completedScheduledTrips.length;

  // Defined Passenger Challenges
  const passengerChallenges = [
    {
      id: 'pass_ch_first_ride',
      title: '🌟 رحلة الانطلاق الأولى',
      subtitle: 'أكمل رحلتك الأولى مع آدم واحصل على رصيد ترحيبي',
      target: 1,
      rewardBonus: 2.0,
      rewardPoints: 100,
      badge: 'مكافأة ترحيبية',
      description: 'استمتع بأول تجربة تنقل واحصل على رصيد مباشر في محفظتك.'
    },
    {
      id: 'pass_ch_intercity_streak',
      title: '🚌 رحلات المحافظات الموفرة',
      subtitle: 'أكمل رحلتين بين المحافظات خلال الأسبوع',
      target: 2,
      rewardBonus: 3.5,
      rewardPoints: 200,
      badge: 'توفير المحافظات',
      description: 'سافر بين عمان والمحافظات واستمتع بخصم رصيد فوري مسترد.'
    },
    {
      id: 'pass_ch_eco_loyal',
      title: '👑 عميل آدم الماسي',
      subtitle: 'أنجز 5 رحلات ناجحة لتفعيل خصم 15% على جميع رحلاتك القادمة',
      target: 5,
      rewardBonus: 5.0,
      rewardPoints: 500,
      badge: 'الولاء الماسي',
      description: 'التنقل المستمر يمنحك تصنيف VIP ومكافأة كاش باك فورية.'
    }
  ];

  const handleClaimReward = async (challengeId: string, title: string, bonus: number) => {
    setIsClaiming(challengeId);
    try {
      if (claimChallengeReward) {
        const res = claimChallengeReward(loggedPassenger.id, 'passenger', challengeId);
        if (res && res.success) {
          alert(`🎉 ${res.msg}`);
          setIsClaiming(null);
          return;
        }
      }

      if (addWalletTransaction) {
        addWalletTransaction(
          loggedPassenger.id,
          'passenger',
          'deposit',
          bonus,
          `🎁 مكافأة إنجاز التحدي: ${title}`,
          'completed',
          `REWARD_${Date.now()}`,
          'bonus'
        );
        alert(`🎉 مبروك! تم إضافة ${bonus.toFixed(2)} د.أ إلى محفظتك كمكافأة إنجاز.`);
      }
    } catch {
      alert('حدث خطأ أثناء استلام المكافأة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsClaiming(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900/60 border border-indigo-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between flex-row-reverse">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
          <Trophy className="w-6 h-6" />
        </div>
        <div className="text-right flex-1 pr-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-white">تحديات وبرنامج مكافآت الركاب 🏆</h3>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] px-2 py-0.5 rounded-full font-bold">
              نقود حقيقية
            </span>
          </div>
          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
            أكمل مشاويرك اليومية، واجمع النقاط، واستبدلها برصيد مجاني في محفظتك لرحلاتك القادمة.
          </p>
        </div>
      </div>

      {/* Passenger Stats Cards */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[9px] text-slate-400 font-bold">الرحلات المكتملة</span>
          <span className="text-sm font-black text-amber-400 font-mono mt-0.5">{totalCompletedTrips}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[9px] text-slate-400 font-bold">نقاط المكافآت</span>
          <span className="text-sm font-black text-indigo-400 font-mono mt-0.5">{(loggedPassenger.rewardPoints || totalCompletedTrips * 50)}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl flex flex-col items-center justify-center">
          <span className="text-[9px] text-slate-400 font-bold">رصيد المحفظة</span>
          <span className="text-sm font-black text-emerald-400 font-mono mt-0.5">{(loggedPassenger.walletBalance || 0).toFixed(2)} د.أ</span>
        </div>
      </div>

      {/* Challenges List */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>تحديات الرحلات المتاحة حالياً:</span>
        </span>

        {passengerChallenges.map((ch) => {
          const progress = Math.min(totalCompletedTrips, ch.target);
          const progressPct = Math.min(100, Math.round((progress / ch.target) * 100));
          const isEligible = progress >= ch.target;
          const isClaimed = (loggedPassenger.claimedOffers || []).includes(ch.id);

          return (
            <div 
              key={ch.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 transition rounded-2xl p-3.5 flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between">
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-lg font-mono">
                  +{ch.rewardBonus.toFixed(2)} د.أ كاش
                </span>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="bg-indigo-500/20 text-indigo-300 text-[8px] font-bold px-1.5 py-0.5 rounded">
                      {ch.badge}
                    </span>
                    <h4 className="text-xs font-black text-slate-100">{ch.title}</h4>
                  </div>
                  <p className="text-[9.5px] text-slate-400 mt-1">{ch.subtitle}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                <div 
                  className={`h-full transition-all duration-500 ${isEligible ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px]">
                {isClaimed ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم استلام المكافأة بنجاح</span>
                  </span>
                ) : isEligible ? (
                  <button
                    type="button"
                    disabled={isClaiming === ch.id}
                    onClick={() => handleClaimReward(ch.id, ch.title, ch.rewardBonus)}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1 px-3 rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1"
                  >
                    {isClaiming === ch.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <>
                        <Gift className="w-3 h-3" />
                        <span>استلام المكافأة الآن 🎁</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-slate-500 font-medium">
                    متبقي {ch.target - progress} مشوار لاكتمال التحدي
                  </span>
                )}
                <span className="text-slate-400 font-bold font-mono">
                  {progress} / {ch.target} ({progressPct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo Code Box */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2 shadow-md">
        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
          <Ticket className="w-4 h-4 text-amber-400" />
          <span>تفعيل كوبون الخصم أو كود المكافأة</span>
        </span>
        <p className="text-[9.5px] text-slate-400 leading-relaxed">
          أدخل أي رمز ترويجي حصلت عليه من منصات آدم لشحن رصيدك فورياً.
        </p>
        
        <div className="flex gap-2 mt-1">
          <button
            type="button"
            onClick={() => {
              const code = redeemCodeInput.trim().toUpperCase();
              if (!code) {
                alert('يرجى إدخال رمز الكود أولاً');
                return;
              }
              if (addWalletTransaction) {
                addWalletTransaction(
                  loggedPassenger.id,
                  'passenger',
                  'deposit',
                  3.0,
                  `🎟️ شحن رصيد كود خصم: ${code}`,
                  'completed',
                  `CODE_${Date.now()}`,
                  'bonus'
                );
                setRedeemStatusMsg(`🎉 تم تفعيل الكود ${code} وإضافة 3.00 د.أ إلى محفظتك!`);
                setRedeemCodeInput('');
              } else {
                setRedeemStatusMsg('✅ تم تفعيل الكود بنجاح!');
              }
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-4 py-2 text-xs rounded-xl transition cursor-pointer shrink-0"
          >
            تطبيق الكود ✨
          </button>
          <input
            type="text"
            value={redeemCodeInput}
            onChange={(e) => setRedeemCodeInput(e.target.value)}
            placeholder="مثال: ADAM2026"
            className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs font-bold tracking-widest text-center uppercase rounded-xl px-3 py-2 flex-1 focus:ring-1 focus:ring-indigo-500 outline-none"
          />
        </div>

        {redeemStatusMsg && (
          <div className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-xl text-[10px] font-bold text-center mt-1">
            {redeemStatusMsg}
          </div>
        )}
      </div>
    </div>
  );
};
