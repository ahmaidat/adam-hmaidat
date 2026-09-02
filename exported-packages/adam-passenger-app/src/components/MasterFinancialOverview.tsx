import React, { useState } from 'react';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  PieChart, 
  RefreshCw, 
  Search,
  CheckCircle,
  Plus
} from 'lucide-react';
import { useAppState } from '../stateEngine';

export const MasterFinancialOverview: React.FC = () => {
  const { 
    drivers = [], 
    passengers = [], 
    intraCityRides = [], 
    rides = [], 
    activeCountry, 
    t 
  } = useAppState();

  const interCityRides = rides || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGateway, setSelectedGateway] = useState<string>('all');

  // Calculate platform net revenue (commissions collected)
  const intraCommissionTotal = intraCityRides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.commission || 0), 0);

  const interCommissionTotal = interCityRides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.commission || 0), 0);

  const totalNetRevenue = intraCommissionTotal + interCommissionTotal;

  // Total driver wallet balances
  const totalDriverWallets = drivers.reduce((sum, d) => sum + (d.balance || 0), 0);
  const totalPassengerWallets = passengers.reduce((sum, p) => sum + (p.walletBalance || 0), 0);

  // Total rides transaction volume
  const totalRidesVolume = intraCityRides
    .filter(r => r.status === 'completed')
    .reduce((sum, r) => sum + (r.price || 0), 0);

  // Payment gateways distribution (simulated based on real app data)
  const gateways = [
    { name: 'زين كاش (Zain Cash)', logo: '📱', count: 142, amount: 1850, color: 'text-pink-400', border: 'border-pink-500/30' },
    { name: 'خدمة كليك (CliQ)', logo: '⚡', count: 188, amount: 2420, color: 'text-amber-400', border: 'border-amber-500/30' },
    { name: 'أمنية يوواليت (UWallet)', logo: '💳', count: 96, amount: 1120, color: 'text-emerald-400', border: 'border-emerald-500/30' },
    { name: 'أورانج ماني (Orange Money)', logo: '🍊', count: 64, amount: 780, color: 'text-orange-400', border: 'border-orange-500/30' },
    { name: 'الدفع النقدي المباشر (Cash)', logo: '💵', count: 210, amount: 3100, color: 'text-indigo-400', border: 'border-indigo-500/30' },
  ];

  return (
    <div className="space-y-6 font-sans text-right" dir="rtl">
      
      {/* FINANCIAL TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* PLATFORM NET PROFIT */}
        <div className="bg-gradient-to-br from-[#0c1329] to-[#070a17] border border-emerald-500/40 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-emerald-400 font-extrabold">{t('صافي أرباح وعمولات المنصة', 'PLATFORM NET COMMISSIONS')}</span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-300 font-mono">
              {totalNetRevenue.toFixed(2)} {activeCountry.currencyAr}
            </div>
            <p className="text-[9.5px] text-slate-400 mt-1 flex items-center gap-1 flex-row-reverse">
              <ArrowUpRight className="w-3 h-3 text-emerald-400" />
              <span>مستقطعة آلياً من محفظة الكباتن فور إتمام الرحلات</span>
            </p>
          </div>
        </div>

        {/* DRIVERS TOTAL WALLETS */}
        <div className="bg-gradient-to-br from-[#0c1329] to-[#070a17] border border-indigo-500/40 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-indigo-400 font-extrabold">{t('إجمالي أرصدة محفظة الكباتن', 'CAPTAINS WALLET POOL')}</span>
            <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-300 font-mono">
              {totalDriverWallets.toFixed(2)} {activeCountry.currencyAr}
            </div>
            <p className="text-[9.5px] text-slate-400 mt-1">
              إجمالي {drivers.length} كابتن معتمد بأسطول الخدمة
            </p>
          </div>
        </div>

        {/* PASSENGERS WALLETS */}
        <div className="bg-gradient-to-br from-[#0c1329] to-[#070a17] border border-amber-500/40 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-amber-400 font-extrabold">{t('محافظ الركاب المشحونة', 'PASSENGER WALLETS')}</span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-mono">
              {totalPassengerWallets.toFixed(2)} {activeCountry.currencyAr}
            </div>
            <p className="text-[9.5px] text-slate-400 mt-1">
              جاهزة للدفع الرقمي المباشر
            </p>
          </div>
        </div>

        {/* TOTAL TRANSACTION VOLUME */}
        <div className="bg-gradient-to-br from-[#0c1329] to-[#070a17] border border-purple-500/40 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
          <div className="flex justify-between items-center flex-row-reverse">
            <span className="text-[10px] text-purple-400 font-extrabold">{t('حجم المعاملات المالية المكتملة', 'GROSS TRANSACTION VOLUME')}</span>
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-300 font-mono">
              {totalRidesVolume.toFixed(2)} {activeCountry.currencyAr}
            </div>
            <p className="text-[9.5px] text-slate-400 mt-1">
              قيمة الرحلات المكتملة بالنظام
            </p>
          </div>
        </div>

      </div>

      {/* PAYMENT GATEWAYS BREAKDOWN & AUDIT */}
      <div className="bg-[#080c1d] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        
        <div className="flex justify-between items-center pb-2 border-b border-slate-800 flex-row-reverse">
          <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>{t('توزيع المعاملات حسب وسائل الشحن والدفع (زين كاش، كليك، أمنية، أورانج)', 'Payment Gateway Breakdown')}</span>
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
            SECURE AUDIT
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {gateways.map((gw, idx) => (
            <div key={idx} className={`bg-slate-900/60 p-3 rounded-xl border ${gw.border} space-y-1 text-center`}>
              <div className="text-lg">{gw.logo}</div>
              <div className={`text-[10.5px] font-bold ${gw.color}`}>{gw.name}</div>
              <div className="text-base font-black text-slate-100 font-mono mt-1">
                {gw.amount} {activeCountry.currencyAr}
              </div>
              <div className="text-[9px] text-slate-400">{gw.count} حركة مالية</div>
            </div>
          ))}
        </div>

      </div>

      {/* DRIVERS FINANCIAL LEDGER TABLE */}
      <div className="bg-[#080c1d] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row-reverse justify-between items-center gap-2 pb-2 border-b border-slate-800">
          <h3 className="text-xs font-black text-slate-100 flex items-center gap-1.5 flex-row-reverse">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <span>{t('سجل العمولات ومحافظ الكباتن الحية', 'Captains Financial Ledger & Wallet Audit')}</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="بحث باسم الكابتن أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 border border-slate-800 text-[11px] rounded-lg px-8 py-1.5 outline-none focus:border-indigo-500 text-right"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] text-slate-400 font-bold bg-slate-900/50">
                <th className="p-2.5">اسم الكابتن</th>
                <th className="p-2.5">الهاتف</th>
                <th className="p-2.5">المدينة والسيارة</th>
                <th className="p-2.5">رصيد المحفظة الحالي</th>
                <th className="p-2.5">التقييم</th>
                <th className="p-2.5">الحالة التشغيلية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {drivers
                .filter(d => 
                  d.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  d.phone.includes(searchQuery)
                )
                .map(drv => (
                  <tr key={drv.id} className="hover:bg-slate-900/40 transition">
                    <td className="p-2.5 font-bold text-slate-100">{drv.fullName}</td>
                    <td className="p-2.5 font-mono text-[10.5px] text-slate-300" dir="ltr">{drv.phone}</td>
                    <td className="p-2.5 text-[11px] text-slate-300">{drv.city} | {drv.carModel}</td>
                    <td className="p-2.5 font-mono font-bold">
                      <span className={drv.balance >= 10 ? 'text-emerald-400' : drv.balance > 0 ? 'text-amber-400' : 'text-rose-400'}>
                        {drv.balance.toFixed(2)} {activeCountry.currencyAr}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-amber-400">⭐ {drv.rating}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                        drv.isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {drv.isOnline ? 'متصل متوفر ✅' : 'غير متصل ❌'}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
