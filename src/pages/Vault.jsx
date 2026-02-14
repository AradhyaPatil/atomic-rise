import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { getConsistencyScore } from "../utils/storage";
import { Lock, Unlock, Plus, TrendingUp, Shield, Zap, AlertTriangle } from "lucide-react";
import "./Vault.css";

export default function Vault() {
    const { state, dispatch, derived } = useApp();
    const [depositAmount, setDepositAmount] = useState("");
    const [selectedGoalId, setSelectedGoalId] = useState("");
    const [showDeposit, setShowDeposit] = useState(false);

    const vault = state.vault || { deposits: [], totalBalance: 0 };
    const { avgConsistency } = derived;

    // Check unlock conditions for each deposit
    const depositsWithStatus = useMemo(() => {
        return vault.deposits.map((dep) => {
            const linkedHabit = state.habits.find((h) => h.id === dep.linked_goal_id);
            let completionPct = 0;
            let canUnlock = false;

            if (linkedHabit) {
                const cons = Math.round(getConsistencyScore(linkedHabit));
                const totalCompletions = Object.keys(linkedHabit.completions || {}).length;
                const phaseLevel = totalCompletions < 7 ? 1 : totalCompletions < 21 ? 2 : totalCompletions < 45 ? 3 : 4;
                completionPct = Math.min(100, Math.round((totalCompletions / 45) * 100));
                canUnlock = phaseLevel >= 4 && cons >= 80;
            }

            return { ...dep, completionPct, canUnlock, linkedHabit };
        });
    }, [vault.deposits, state.habits]);

    const handleDeposit = () => {
        const amount = parseInt(depositAmount);
        if (!amount || amount <= 0 || !selectedGoalId) return;
        dispatch({
            type: "VAULT_DEPOSIT",
            payload: { amount, linked_goal_id: selectedGoalId },
        });
        setDepositAmount("");
        setSelectedGoalId("");
        setShowDeposit(false);
    };

    const handleUnlock = (depositId) => {
        dispatch({ type: "VAULT_UNLOCK", payload: { depositId } });
    };

    const multiplierActive = avgConsistency >= 90;

    return (
        <div className="page-enter vault-page">
            {/* Vault Hero */}
            <div className="vault-hero card card-gold">
                <div className="vault-hero-icon">
                    <Lock size={28} />
                </div>
                <h2 className="vault-balance">₹{vault.totalBalance.toLocaleString()}</h2>
                <p className="vault-subtitle">Committed Funds</p>
                <div className="vault-lock-msg">
                    <Shield size={14} />
                    <span>Funds unlock only when your goal is fully completed</span>
                </div>
                {multiplierActive && (
                    <div className="vault-multiplier">
                        <Zap size={14} />
                        <span>90%+ consistency — 5% bonus coins active!</span>
                    </div>
                )}
            </div>

            {/* Deposit button */}
            {!showDeposit ? (
                <button className="btn btn-primary btn-full vault-add-btn" onClick={() => setShowDeposit(true)}>
                    <Plus size={18} /> Add Commitment
                </button>
            ) : (
                <div className="vault-deposit card">
                    <h3>New Commitment</h3>
                    <div className="vault-field">
                        <label>Link to Habit</label>
                        <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)}>
                            <option value="">Select a habit...</option>
                            {state.habits.map((h) => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="vault-field">
                        <label>Commitment Amount (₹)</label>
                        <input
                            type="number"
                            placeholder="Enter amount"
                            min="1"
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                        />
                    </div>
                    <div className="vault-unlock-req">
                        <AlertTriangle size={13} />
                        <span>Unlocks when: Phase 4 completed + ≥80% consistency</span>
                    </div>
                    <div className="vault-deposit-actions">
                        <button className="btn btn-sm" onClick={() => setShowDeposit(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleDeposit} disabled={!depositAmount || !selectedGoalId}>
                            <Lock size={14} /> Lock Funds
                        </button>
                    </div>
                </div>
            )}

            {/* Active deposits */}
            {depositsWithStatus.length > 0 && (
                <div className="vault-deposits">
                    <h3 className="section-title" style={{ marginTop: 20 }}>Active Commitments</h3>
                    {depositsWithStatus.map((dep) => (
                        <div key={dep.id} className={`vault-dep card ${dep.canUnlock ? "vault-dep-unlockable" : ""}`}>
                            <div className="vault-dep-header">
                                <div>
                                    <strong className="vault-dep-name">{dep.linkedHabit?.name || "Unlinked"}</strong>
                                    <span className={`vault-dep-status ${dep.status}`}>
                                        {dep.status === "locked" ? "🔒 Locked" : "🔓 Unlocked"}
                                    </span>
                                </div>
                                <span className="vault-dep-amount">₹{dep.amount.toLocaleString()}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="vault-dep-progress">
                                <div className="vault-dep-fill" style={{ width: `${dep.completionPct}%` }} />
                            </div>
                            <div className="vault-dep-meta">
                                <span>{dep.completionPct}% complete</span>
                                <span>Need: Phase 4 + 80% consistency</span>
                            </div>

                            {dep.canUnlock && dep.status === "locked" && (
                                <button className="btn btn-primary btn-sm vault-unlock-btn" onClick={() => handleUnlock(dep.id)}>
                                    <Unlock size={14} /> Unlock Funds
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {depositsWithStatus.length === 0 && !showDeposit && (
                <div className="vault-empty card">
                    <div className="vault-empty-icon">🏦</div>
                    <h3>Your Vault is Empty</h3>
                    <p>Add a monetary commitment to any habit. Put skin in the game — you'll unlock the funds when you achieve your goal.</p>
                    <div className="vault-benefits">
                        <div className="vault-benefit"><Shield size={13} /> <span>Loss aversion motivates consistency</span></div>
                        <div className="vault-benefit"><TrendingUp size={13} /> <span>Commitment bias increases follow-through</span></div>
                        <div className="vault-benefit"><Zap size={13} /> <span>Identity accountability deepens growth</span></div>
                    </div>
                </div>
            )}
        </div>
    );
}
