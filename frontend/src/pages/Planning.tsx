import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Compass, TrendingUp, Target, Calculator, Info, ShieldAlert, Zap } from 'lucide-react';

interface Projection {
    year: number;
    assets: number;
    liabilities: number;
    net_worth: number;
}

interface GoalResult {
    status: string;
    needed_amount: number;
    monthly_required: number;
    current_avg_savings: number;
    shortfall: number;
    months_to_goal: number;
    message?: string;
}

interface RetirementResult {
    target_corpus: number;
    estimated_corpus: number;
    on_track: boolean;
    shortfall: number;
    years_left: number;
}

const Planning: React.FC = () => {
    // Net Worth Projection State
    const [years, setYears] = useState(15);
    const [growthRate, setGrowthRate] = useState(7);
    const [projections, setProjections] = useState<Projection[]>([]);

    // Goal Planning State
    const [targetAmount, setTargetAmount] = useState('5000000');
    const [targetDate, setTargetDate] = useState('2030-12-31');
    const [goalResult, setGoalResult] = useState<GoalResult | null>(null);

    // Retirement State
    const [currentAge, setCurrentAge] = useState(28);
    const [retirementAge, setRetirementAge] = useState(55);
    const [retirementResult, setRetirementResult] = useState<RetirementResult | null>(null);

    // Scenario State
    const [scenarioType, setScenarioType] = useState('emergency_withdrawal');
    const [scenarioAmount, setScenarioAmount] = useState('100000');
    const [scenarioResult, setScenarioResult] = useState<any>(null);

    const [loading, setLoading] = useState(true);

    const fetchProjections = async () => {
        try {
            const res = await api.get(`/planning/net-worth-projection?years=${years}&growth_rate=${growthRate}`);
            setProjections(res.data);
        } catch (e) { console.error(e); }
    };

    const calculateGoal = async () => {
        try {
            const res = await api.get(`/planning/goal-feasibility?target_amount=${targetAmount}&target_date=${targetDate}`);
            setGoalResult(res.data);
        } catch (e) { console.error(e); }
    };

    const estimateRetirement = async () => {
        try {
            const res = await api.get(`/planning/retirement-estimate?current_age=${currentAge}&retirement_age=${retirementAge}`);
            setRetirementResult(res.data);
        } catch (e) { console.error(e); }
    };

    const runScenario = async () => {
        try {
            const res = await api.get(`/planning/simulate?event_type=${scenarioType}&amount=${scenarioAmount}`);
            setScenarioResult(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchProjections(), calculateGoal(), estimateRetirement()]);
            setLoading(false);
        };
        init();
    }, []);

    if (loading) return <div className="text-center py-10">Running Projections...</div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b pb-4">
                <Compass className="w-8 h-8 md:w-12 md:h-12 text-indigo-600" />
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Financial Advisor</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Project & Plan Your Future</p>
                </div>
            </div>

            {/* 1. Net Worth Projection */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-indigo-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-lg md:text-xl font-black text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Wealth Projection
                        </h3>
                        <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">Assets vs Liabilities</p>
                    </div>
                    <div className="flex items-end gap-3 w-full sm:w-auto">
                        <div className="flex-1 sm:flex-none">
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-tighter">Years</label>
                            <input
                                type="number" value={years} onChange={(e) => setYears(parseInt(e.target.value))}
                                className="w-full sm:w-16 p-1 border-b text-center font-bold text-sm"
                            />
                        </div>
                        <div className="flex-1 sm:flex-none">
                            <label className="block text-[8px] font-black text-gray-400 uppercase tracking-tighter">Growth %</label>
                            <input
                                type="number" value={growthRate} onChange={(e) => setGrowthRate(parseFloat(e.target.value))}
                                className="w-full sm:w-16 p-1 border-b text-center font-bold text-green-600 text-sm"
                            />
                        </div>
                        <button onClick={fetchProjections} className="bg-indigo-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors">
                            <Zap size={14} />
                        </button>
                    </div>
                </div>

                <div className="h-[250px] md:h-[350px] w-full">
                    <ResponsiveContainer>
                        <AreaChart data={projections}>
                            <defs>
                                <linearGradient id="colorAssets" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `₹${(val / 1000000).toFixed(1)}M`} />
                            <Tooltip
                                formatter={(value: any) => `₹${Number(value || 0).toLocaleString()}`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="assets" stroke="#4f46e5" fillOpacity={1} fill="url(#colorAssets)" name="Projected Assets" />
                            <Area type="monotone" dataKey="liabilities" stroke="#ef4444" fill="#fee2e2" name="Projected Liabilities" />
                            <Area type="monotone" dataKey="net_worth" stroke="#10b981" fill="none" strokeWidth={3} strokeDasharray="5 5" name="Net Worth" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 2. Goal Planning */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-50">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-600" />
                        Dream Goal Calculator
                    </h3>
                    <div className="space-y-4 mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Target Amount (₹)</label>
                                <input
                                    type="number" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Target Date</label>
                                <input
                                    type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                        </div>
                        <button onClick={calculateGoal} className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition">Analyze Feasibility</button>
                    </div>

                    {goalResult && (
                        <div className={`p-4 rounded-xl ${goalResult.status === 'on_track' ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
                            {goalResult.status === 'reached' ? (
                                <p className="text-green-700 font-medium">🎉 You've already reached this goal!</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600 font-medium">Status</span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${goalResult.status === 'on_track' ? 'bg-green-200 text-green-800' : 'bg-orange-200 text-orange-800'}`}>
                                            {goalResult.status === 'on_track' ? 'On Track' : 'Behind'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-t border-black/5 pt-2">
                                        <span className="text-sm text-gray-600">Monthly Savings Required</span>
                                        <span className="font-bold text-blue-800">₹{goalResult.monthly_required.toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 italic">
                                        Your current average monthly savings is ₹{goalResult.current_avg_savings.toLocaleString()}.
                                        {goalResult.shortfall > 0 && ` You need to save ₹${goalResult.shortfall.toLocaleString()} more per month.`}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Retirement Planner */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-purple-50">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-purple-600" />
                        Retirement Estimator
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Current Age</label>
                            <input
                                type="number" value={currentAge} onChange={(e) => setCurrentAge(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1">Retire at Age</label>
                            <input
                                type="number" value={retirementAge} onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <button onClick={estimateRetirement} className="col-span-2 bg-purple-600 text-white py-2 rounded-lg font-bold hover:bg-purple-700 transition">Estimate Retirement Status</button>
                    </div>

                    {retirementResult && (
                        <div className={`p-4 rounded-xl ${retirementResult.on_track ? 'bg-green-50' : 'bg-red-50'}`}>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs text-gray-500 font-bold uppercase">Estimated Corpus at {retirementAge}</span>
                                        <span className="text-xl font-black text-purple-900">₹{(retirementResult.estimated_corpus / 10000000).toFixed(2)} Cr</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${retirementResult.on_track ? 'bg-green-500' : 'bg-red-400'}`}
                                            style={{ width: `${Math.min(100, (retirementResult.estimated_corpus / retirementResult.target_corpus) * 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-bold uppercase">
                                        <span>Current Path</span>
                                        <span>Target: ₹{(retirementResult.target_corpus / 10000000).toFixed(2)} Cr</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-600 border-t pt-2 flex items-start gap-2">
                                    <Info className="w-3.5 h-3.5 mt-0.5 text-purple-400" />
                                    <span>
                                        {retirementResult.on_track
                                            ? `Excellent! You are on track to exceed your retirement goal in ${retirementResult.years_left} years.`
                                            : `You may face a shortfall of ₹${(retirementResult.shortfall / 10000).toFixed(1)} Lakhs. Consider increasing your monthly investments.`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. Scenario Simulation */}
            <div className="bg-gray-900 p-8 rounded-2xl shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Zap className="w-40 h-40 text-yellow-400" />
                </div>

                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-yellow-500" />
                        "What-If" Scenario Simulator
                    </h3>

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Scenario Type</label>
                                <select
                                    value={scenarioType} onChange={(e) => setScenarioType(e.target.value)}
                                    className="w-full bg-gray-800 text-white border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 transition text-sm"
                                >
                                    <option value="emergency_withdrawal">Emergency Withdrawal</option>
                                    <option value="loan_prepayment">Loan Part-Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount (₹)</label>
                                <input
                                    type="number" value={scenarioAmount} onChange={(e) => setScenarioAmount(e.target.value)}
                                    className="w-full bg-gray-800 text-white border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-yellow-500 transition text-sm"
                                    placeholder="Enter amount..."
                                />
                            </div>
                        </div>
                        <button
                            onClick={runScenario}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black font-black py-4 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition tracking-widest text-xs uppercase"
                        >
                            SIMULATE IMPACT
                        </button>
                    </div>

                    {scenarioResult && (
                        <div className="mt-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 animate-in fade-in slide-in-from-bottom-4">
                            <h4 className="text-yellow-400 font-bold mb-3 uppercase tracking-widest text-xs">Simulation Results</h4>
                            <p className="text-lg text-white leading-relaxed font-medium">
                                {scenarioResult.description}
                            </p>
                            <div className="mt-4 flex gap-6">
                                <div className="bg-white/5 rounded-lg px-4 py-2">
                                    <span className="text-[10px] text-gray-400 block uppercase font-bold">Immediate Impact</span>
                                    <span className={`text-xl font-black ${scenarioResult.immediate_impact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                        ₹{Math.abs(scenarioResult.immediate_impact).toLocaleString()}
                                    </span>
                                </div>
                                {scenarioResult.impact_at_10y && (
                                    <div className="bg-white/5 rounded-lg px-4 py-2">
                                        <span className="text-[10px] text-gray-400 block uppercase font-bold">10-Year Net Worth Δ</span>
                                        <span className="text-xl font-black text-red-500">
                                            -₹{Math.abs(scenarioResult.impact_at_10y).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                                {scenarioResult.interest_saved_approx && (
                                    <div className="bg-white/5 rounded-lg px-4 py-2">
                                        <span className="text-[10px] text-gray-400 block uppercase font-bold">Est. Interest Saved</span>
                                        <span className="text-xl font-black text-green-400">
                                            +₹{scenarioResult.interest_saved_approx.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Planning;
