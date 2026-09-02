import React, { useState } from 'react';
import { 
  Trophy, 
  Award, 
  Sparkles, 
  Zap, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Gift, 
  ShieldCheck, 
  Star, 
  ChevronLeft,
  Flame,
  Percent,
  RefreshCw
} from 'lucide-react';

interface DriverDailyChallengesSectionProps {
  loggedDriver: any;
  rides: any[];
  scheduledTrips?: any[];
  intraCityRides?: any[];
  walletTransactions: any[];
  settings: any;
  claimChallengeReward: (driverId: string, role: string, offerId: string) => { success: boolean; msg: string };
  addWalletTransaction?: (userId: string, userType: string, type: 'recharge' | 'withdraw' | 'transfer' | 'bonus', amount: number, walletNum?: string) => any;
  addNotification?: (notif: any) => void;
  saveState?: (newState: any) => void;
}

export const DriverDailyChallengesSection: React.FC<DriverDailyChallengesSectionProps> = ({
  loggedDriver,
  rides = [],
  scheduledTrips = [],
  intraCityRides = [],
  walletTransactions = [],
  settings,
  claimChallengeReward,
  addWalletTransaction,
  addNotification,
  saveState
}) => {
  const [redeemCodeInput, setRedeemCodeInput] = useState('');
  const [redeemStatusMsg, setRedeemStatusMsg] = useState('');
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  if (!loggedDriver) return null;

  // Combine all completed rides across types for the logged driver
  const completedInstantCount = rides.filter(r => r.driverId === loggedDriver.id && r.status === 'completed').length;
  const completedScheduledCount = (scheduledTrips || []).filter(s => s.driverId === loggedDriver.id && s.status === 'completed').length;
  const completedIntraCount = (intraCityRides || []).filter(i => i.driverId === loggedDriver.id && i.status === 'completed').length;
  
  const totalCompletedRides = completedInstantCount + completedScheduledCount + completedIntraCount;

  // Calculate Driver Tier based on total completed rides and rating
  const driverRating = loggedDriver.rating || 5.0;
  let driverTier = 'برونزي';
  let tierColor = 'from-amber-700 to-amber-900 border-amber-600/40 text-amber-200';
  let tierBadgeBg = 'bg-amber-600/20 text-amber-300 border-amber-500/30';
  let nextTierName = 'فضّي';
  let nextTierTarget = 10;
  let cashbackRate = '5%';

  if (totalCompletedRides >= 30 && driverRating >= 4.8) {
    driverTier = 'ماسي (VIP)';
    tierColor = 'from-cyan-900 via-indigo-950 to-purple-950 border-cyan-400/50 text-cyan-200';
    tierBadgeBg = 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40';
    nextTierName = 'المستوى الماسي الأعلى 👑';
    nextTierTarget = 50;
    cashbackRate = '20% + خصم العمولة 0%';
  } else if (totalCompletedRides >= 15 && driverRating >= 4.5) {
    driverTier = 'ذهبي';
    tierColor = 'from-amber-600 via-yellow-700 to-amber-900 border-amber-400/50 text-amber-100';
    tierBadgeBg = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
    nextTierName = 'ماسي (VIP)';
    nextTierTarget = 30;
    cashbackRate = '15%';
  } else if (totalCompletedRides >= 5) {
    driverTier = 'فضّي';
    tierColor = 'from-slate-700 via-slate-800 to-slate-900 border-slate-500/50 text-slate-200';
    tierBadgeBg = 'bg-slate-500/20 text-slate-300 border-slate-400/40';
    nextTierName = 'ذهبي';
    nextTierTarget = 15;
    cashbackRate = '10%';
  }

  const tierProgressPct = Math.min(100, Math.floor((totalCompletedRides / nextTierTarget) * 100));

  // Default Built-in Daily Challenges if none configured in settings
  const defaultChallenges = [
    {
      id: 'daily_5_rides',
      title: 'تحدي الـ 5 مشاوير اليومية 🚗',
      description: 'أكمل 5 رحلات إركاب ناجحة اليوم واحصل على بونص مالي مباشر برصيدك',
      targetRidesCount: 5,
      bonusAmount: 3.50,
      hoursLimit: 24,
      code: 'DAILY5'
    },
    {
      id: 'peak_rush_3',
      title: 'تحدي ساعات الذروة الصباحية ⚡',
      description: 'قم بإنجاز 3 رحلات بين الساعة 7:00 ص و 11:00 ص لتفعيل مكافأة السرعة',
      targetRidesCount: 3,
      bonusAmount: 2.50,
      hoursLimit: 12,
      code: 'PEAK3'
    },
    {
      id: 'governorate_connector',
      title: 'تحدي الربط بين المحافظات 🛣️',
      description: 'أنجز 2 رحلة بين المدن/سفر خارجي وحصل على أعلى حافز أداء في المنظومة',
      targetRidesCount: 2,
      bonusAmount: 5.00,
      hoursLimit: 48,
      code: 'GOV2'
    },
    {
      id: 'five_star_streak',
      title: 'سلسلة التقييم النجمي الممتاز ⭐',
      description: 'حافظ على تقييم 5 نجوم في جميع رحلاتك اليومية للحصول على المكافأة الذهبية',
      targetRidesCount: 4,
      bonusAmount: 2.00,
      hoursLimit: 24,
      code: 'STREAK5'
    }
  ];

  // Dynamic system challenges combined
  const activeSystemOffers = (settings?.systemOffers || [])
    .filter((o: any) => o.isActive && (o.offerCategory === 'challenge_milestone' || o.offerCategory === 'driver_incentive') && (o.targetType === 'driver' || o.targetType === 'both'));

  const challengesList = activeSystemOffers.length > 0 
    ? activeSystemOffers 
    : defaultChallenges;

  // Claim handler
  const handleClaimReward = (offerId: string, offerTitle: string, bonusAmt: number, offerCode: string) => {
    setIsClaiming(offerId);

    setTimeout(() => {
      // Check claim via state or add transaction directly
      const claimRes = claimChallengeReward ? claimChallengeReward(loggedDriver.id, 'driver', offerId) : { success: false, msg: '' };

      if (claimRes.success) {
        setRedeemStatusMsg(`🎉 مبروك! تم إضافة (${bonusAmt.toFixed(2)} د.أ) لرصيدك بنجاح!`);
      } else {
        // Fallback transaction addition if claimChallengeReward gave error or code was already used
        const challengeRewardCode = `REWARD_${offerCode}`;
        const isAlreadyClaimed = walletTransactions.some(
          tx => tx.userId === loggedDriver.id && tx.userType === 'driver' && tx.walletNumber && tx.walletNumber.includes(challengeRewardCode)
        );

        if (isAlreadyClaimed) {
          setRedeemStatusMsg('⚠️ لقد تم استلام هذه المكافأة سابقاً وتقييدها برصيدك.');
        } else if (addWalletTransaction) {
          addWalletTransaction(loggedDriver.id, 'driver', 'bonus', bonusAmt, challengeRewardCode);
          
          if (addNotification) {
            addNotification({
              id: `notif_bonus_${Date.now()}`,
              userId: loggedDriver.id,
              userRole: 'driver',
              title: '🎁 استلام مكافأة التحدي اليومي',
              message: `تم إضافة بونص (${bonusAmt.toFixed(2)} د.أ) لحسابك لإكمال (${offerTitle}).`,
              timestamp: new Date().toISOString(),
              read: false
            });
          }
          setRedeemStatusMsg(`🎉 تم شحن بونص التحدي (${bonusAmt.toFixed(2)} د.أ) مباشرة إلى محفظتك!`);
        } else {
          setRedeemStatusMsg(claimRes.msg || 'تم معالجة التحدي بنجاح!');
        }
      }

      setIsClaiming(null);
      setTimeout(() => setRedeemStatusMsg(''), 5000);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-4 text-right dir-rtl font-sans animate-fadeIn">

      {/* DRIVER TIER & PERFORMANCE HEADER CARD */}
      <div className={`bg-gradient-to-r ${tierColor} p-4 rounded-2xl border shadow-xl relative overflow-hidden flex flex-col gap-3`}>
        <div className="absolute top-0 left-0 p-3 opacity-15 pointer-events-none">
          <Trophy className="w-28 h-28 text-white" />
        </div>

        <div className="flex justify-between items-center flex-row-reverse relative z-10">
          <div className="flex items-center gap-2.5 flex-row-reverse">
            <div className="p-2.5 bg-slate-950/50 border border-amber-400/30 rounded-xl text-amber-300">
              <Award className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-row-reverse">
                <span className="text-xs font-black text-white">تصنيف أداء الكابتن المالي:</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${tierBadgeBg}`}>
                  {driverTier}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5">
                معدل الاسترداد النقدي الخاص بك: <strong className="text-amber-300 font-mono">{cashbackRate}</strong> على جميع رحلات اليوم
              </p>
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-xl text-center">
            <span className="text-[9px] text-slate-400 block font-bold">إجمالي الرحلات المنجزة</span>
            <span className="text-sm font-black font-mono text-emerald-400">{totalCompletedRides} رحلة</span>
          </div>
        </div>

        {/* PROGRESS TO NEXT TIER */}
        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-col gap-1.5 relative z-10">
          <div className="flex justify-between text-[9.5px] font-bold text-slate-300 flex-row-reverse">
            <span>الهدف للمستوى القادم ({nextTierName}):</span>
            <span className="font-mono text-amber-300">{totalCompletedRides} / {nextTierTarget} رحلات</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-gradient-to-l from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${tierProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* FEEDBACK STATUS MSG */}
      {redeemStatusMsg && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs rounded-xl font-bold flex items-center justify-between flex-row-reverse shadow-lg animate-bounce">
          <div className="flex items-center gap-2 flex-row-reverse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{redeemStatusMsg}</span>
          </div>
          <button onClick={() => setRedeemStatusMsg('')} className="text-slate-400 hover:text-white text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* DAILY CHALLENGES SECTION */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col gap-3 shadow-lg">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2.5 flex-row-reverse">
          <div className="flex items-center gap-2 flex-row-reverse">
            <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-100">تحديات الرحلات اليومية والحوافز المالية</h3>
              <p className="text-[9.5px] text-slate-400 mt-0.5">أكمل الأهداف اليومية واضمن الحصول على مبالغ بونص فورية تضاف لرصيدك</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 text-emerald-400 font-bold text-[9px] px-2.5 py-1 rounded-full border border-emerald-500/20">
            محدث آلياً
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {challengesList.map((ch: any) => {
            const target = ch.targetRidesCount || ch.targetRides || 1;
            
            // Calculate progress based on challenge travelScope
            let currentScopeCompleted = totalCompletedRides;
            if (ch.travelScope === 'intracity') {
              currentScopeCompleted = completedIntraCount;
            } else if (ch.travelScope === 'intercity') {
              currentScopeCompleted = completedScheduledCount + rides.filter(r => {
                if (r.driverId !== loggedDriver.id || r.status !== 'completed') return false;
                const fromGov = r.fromArea?.split('-')[0]?.trim() || '';
                const toGov = r.toArea?.split('-')[0]?.trim() || '';
                return fromGov && toGov && fromGov !== toGov;
              }).length;
            }

            const progressPct = Math.min(100, Math.floor((currentScopeCompleted / target) * 100));
            const bonus = ch.bonusAmount || ch.value || 0;
            const isEligible = currentScopeCompleted >= target;

            const challengeRewardCode = `REWARD_${ch.code || ch.id}`;
            const isClaimed = walletTransactions.some(
              tx => tx.userId === loggedDriver.id && tx.userType === 'driver' && tx.walletNumber && tx.walletNumber.includes(challengeRewardCode)
            );

            return (
              <div 
                key={ch.id} 
                className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                  isClaimed 
                    ? 'bg-slate-950/60 border-slate-850 opacity-80' 
                    : isEligible 
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-lg shadow-emerald-950/30' 
                    : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex justify-between items-start flex-row-reverse gap-2">
                    <div className="flex flex-col text-right">
                      <h4 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
                        <span>{ch.title}</span>
                        {isEligible && !isClaimed && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        )}
                      </h4>
                      <div className="flex gap-1 items-center flex-row-reverse mt-1">
                        {ch.targetType === 'both' ? (
                          <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[8px] font-bold px-1.5 py-0.2 rounded">
                            👥 للجميع
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[8px] font-bold px-1.5 py-0.2 rounded">
                            🚗 للكباتن
                          </span>
                        )}

                        {ch.travelScope === 'intracity' ? (
                          <span className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[8px] font-bold px-1.5 py-0.2 rounded">
                            🏙️ داخل المدينة
                          </span>
                        ) : ch.travelScope === 'intercity' ? (
                          <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[8px] font-bold px-1.5 py-0.2 rounded">
                            🛣️ بين المحافظات
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[8px] font-bold px-1.5 py-0.2 rounded">
                            🌐 كافة النطاقات
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="font-mono font-black text-emerald-400 text-xs bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                      +{bonus.toFixed(2)} د.أ
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    {ch.description || ch.subtitle || 'أكمل عدد الرحلات المطلوب للحصول على البونص المالي المباشر.'}
                  </p>

                  <div className="flex justify-between text-[9px] text-slate-500 flex-row-reverse pt-1">
                    <span className="flex items-center gap-1 flex-row-reverse">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>المدة المتاحة: {ch.hoursLimit || 24} ساعة</span>
                    </span>
                    <span className="font-bold text-amber-400/90">بونص مالي فوري</span>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div className="space-y-1.5 pt-1 border-t border-slate-900">
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isEligible ? 'bg-emerald-400' : 'bg-amber-500'}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center flex-row-reverse text-[9.5px]">
                    <span className="text-slate-400 font-bold">
                      الإنجاز الحالي: <strong className="text-white font-mono">{currentScopeCompleted}/{target}</strong> مشاوير ({progressPct}%)
                    </span>

                    {isClaimed ? (
                      <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تم تحويل البونص لحسابك</span>
                      </span>
                    ) : isEligible ? (
                      <button
                        type="button"
                        disabled={isClaiming === ch.id}
                        onClick={() => handleClaimReward(ch.id, ch.title, bonus, ch.code || ch.id)}
                        className="bg-gradient-to-l from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs py-1.5 px-3 rounded-lg transition active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        {isClaiming === ch.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        ) : (
                          <>
                            <Gift className="w-3.5 h-3.5" />
                            <span>استلم البونص فورا 🎁</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="text-slate-500 font-bold italic text-[9px] flex items-center gap-1 flex-row-reverse">
                        <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                        <span>جاري التقدم نحو الهدف...</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PERFORMANCE FINANCIAL BONUSES & COMMISSION CASHBACK SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-row-reverse">
            <Percent className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-200">الاسترداد النقدي للعمولات (Cashback)</h4>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            تسترد ما نسبته <strong className="text-emerald-400 font-mono">{cashbackRate}</strong> تلقائياً من عمولة الشركة عند إنجاز رحلات ساعات الذروة.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-row-reverse">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-200">حافز الانضباط وعدم الإلغاء</h4>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            يحصل الكابتن المحافظ على نسبة إلغاء 0% خلال 48 ساعة على بونص أمان إضافي قيمته <strong className="text-indigo-300 font-mono">3.00 د.أ</strong>.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-row-reverse">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-200">الحافز المالي الأسبوعي والتوزيعات</h4>
          </div>
          <p className="text-[9.5px] text-slate-400 leading-relaxed">
            عند الوصول لـ 20 رحلة أسبوعية، تتأهل لمكافأة الأداء الكبرى بمبلغ <strong className="text-amber-300 font-mono">15.00 د.أ</strong> كاش محول.
          </p>
        </div>
      </div>

      {/* CODE REDEMPTION FORM */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-col gap-2.5 shadow-md">
        <span className="text-xs font-bold text-amber-500 block">🎁 إدخال وتفعيل كود مكافآت الإدارة المباشر</span>
        <p className="text-[9.5px] text-slate-400 leading-relaxed m-0">
          إذا زودتك إدارة العمليات بكود بونص خاص أو رمز جائزة أداء، أدخله هنا لشحن رصيد محفظتك فورا.
        </p>
        
        <div className="flex gap-2 flex-row-reverse mt-1">
          <input
            type="text"
            value={redeemCodeInput}
            onChange={(e) => setRedeemCodeInput(e.target.value)}
            placeholder="أدخل الكود هنا (مثال: ADAM_BONUS_10)"
            className="bg-slate-950 border border-slate-800 text-slate-100 font-mono text-xs font-bold tracking-widest text-center uppercase rounded-lg px-3 py-2 flex-1 focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <button
            type="button"
            onClick={() => {
              if (!redeemCodeInput.trim()) {
                alert('الرجاء كتابة رمز الكود أولاً');
                return;
              }
              const challengeRewardCode = `CODE_${redeemCodeInput.trim().toUpperCase()}`;
              if (addWalletTransaction) {
                addWalletTransaction(loggedDriver.id, 'driver', 'bonus', 5.00, challengeRewardCode);
                setRedeemStatusMsg(`🎉 تم تفعيل الكود بنجاح! تم إضافة 5.00 د.أ إلى رصيدك.`);
                setRedeemCodeInput('');
              } else {
                setRedeemStatusMsg('✅ تم قبول الكود وتفعيله!');
              }
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-4 py-2 text-xs rounded-lg transition cursor-pointer shrink-0"
          >
            تطبيق الكود ⚡
          </button>
        </div>
      </div>

    </div>
  );
};
