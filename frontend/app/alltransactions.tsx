// app/alltransactions.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import {
    ChevronLeft,
    TrendingDown,
    TrendingUp,
    Search
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
    id: string;
    name: string;
    category: string;
    amount: number;
    type: 'expense' | 'income';
    date: string;
    time: string;
    dateObj: Date;
}

type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom';

export default function AllTransactionsScreen() {
    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>(
        'all'
    );
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // NEW: transactions from backend
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    // TODO: replace with your real userId + API base URL
    const USER_ID = user?.id ?? '693a0451e654cdaccbb42d26';
    const API_BASE_URL = 'http://localhost:8000'; // or from env/config

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);

                const res = await fetch(
                    `${API_BASE_URL}/api/home/all-transactions?userId=${USER_ID}`
                );
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`);
                }

                const json = await res.json();

                const serverTxs = json.transactions ?? [];

                const mapped: Transaction[] = serverTxs.map((t: any) => ({
                    id: String(t.id),
                    name: t.name,
                    category: t.category,
                    amount: t.amount,
                    type: t.type,
                    date: t.date,
                    time: t.time,
                    dateObj: new Date(t.dateObj),
                }));

                setAllTransactions(mapped);
            } catch (e: any) {
                console.error('Failed to load transactions', e);
                setError('Failed to load transactions');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const categoryColors: { [key: string]: string } = {
        Transportation: '#3B82F6',
        'Rent & Utilities': '#0EA5E9',
        'Personal Care': '#F97316',
        'Transfer Out': '#6B7280',
        'Loan Payments': '#A855F7',
        Income: '#22C55E',
        'Food & Drink': '#F59E0B',
        Travel: '#06B6D4',
        'General Merchandise': '#EC4899',
        Entertainment: '#8B5CF6',
    };

    const filteredTransactions = useMemo(() => {
        return allTransactions.filter((transaction) => {
            const matchesSearch =
                transaction.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                transaction.category
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

            const matchesFilter =
                filterType === 'all' || transaction.type === filterType;

            let matchesDateFilter = true;
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            if (dateFilter === '7days') {
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                matchesDateFilter =
                    transaction.dateObj >= sevenDaysAgo &&
                    transaction.dateObj <= today;
            } else if (dateFilter === '30days') {
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                matchesDateFilter =
                    transaction.dateObj >= thirtyDaysAgo &&
                    transaction.dateObj <= today;
            } else if (dateFilter === '90days') {
                const ninetyDaysAgo = new Date(today);
                ninetyDaysAgo.setDate(today.getDate() - 90);
                matchesDateFilter =
                    transaction.dateObj >= ninetyDaysAgo &&
                    transaction.dateObj <= today;
            } else if (
                dateFilter === 'custom' &&
                customStartDate &&
                customEndDate
            ) {
                const startDate = new Date(customStartDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(customEndDate);
                endDate.setHours(23, 59, 59, 999);
                matchesDateFilter =
                    transaction.dateObj >= startDate &&
                    transaction.dateObj <= endDate;
            }

            return matchesSearch && matchesFilter && matchesDateFilter;
        });
    }, [
        allTransactions,
        searchQuery,
        filterType,
        dateFilter,
        customStartDate,
        customEndDate,
    ]);

    const filteredExpenses = useMemo(
        () =>
            filteredTransactions
                .filter((t) => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0),
        [filteredTransactions]
    );

    const filteredIncome = useMemo(
        () =>
            filteredTransactions
                .filter((t) => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0),
        [filteredTransactions]
    );

    return (
        <View style={styles.root}>

            {/* Header */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={8}
                >
                    <ChevronLeft size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>All Transactions</Text>

                {/* Income / Expenses summary */}
                <View style={styles.summaryRow}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Credit</Text>
                        <Text style={styles.summaryValue}>
                            +${filteredIncome.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>Debit</Text>
                        <Text style={styles.summaryValue}>
                            -${filteredExpenses.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Search */}
                <View style={styles.searchContainer}>
                    <Search
                        size={20}
                        color="#9CA3AF"
                        style={styles.searchIcon}
                    />
                    <TextInput
                        placeholder="Search transactions..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            {/* Body */}
            <ScrollView style={styles.bodyContainer}>
                {/* Date Range */}
                <View style={styles.section}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.dateFilterRow}
                    >
                        <FilterChip
                            label="All Time"
                            active={dateFilter === 'all'}
                            onPress={() => {
                                setDateFilter('all');
                                setShowDatePicker(false);
                            }}
                        />
                        <FilterChip
                            label="Last 7 Days"
                            active={dateFilter === '7days'}
                            onPress={() => {
                                setDateFilter('7days');
                                setShowDatePicker(false);
                            }}
                        />
                        <FilterChip
                            label="Last 30 Days"
                            active={dateFilter === '30days'}
                            onPress={() => {
                                setDateFilter('30days');
                                setShowDatePicker(false);
                            }}
                        />
                        <FilterChip
                            label="Last 90 Days"
                            active={dateFilter === '90days'}
                            onPress={() => {
                                setDateFilter('90days');
                                setShowDatePicker(false);
                            }}
                        />
                        <FilterChip
                            label="Custom Range"
                            active={dateFilter === 'custom'}
                            onPress={() => {
                                setDateFilter('custom');
                                setShowDatePicker(true);
                            }}
                        />
                    </ScrollView>

                    {showDatePicker && dateFilter === 'custom' && (
                        <View style={styles.customRangeCard}>
                            <View style={styles.customRangeField}>
                                <Text style={styles.customRangeLabel}>Start Date</Text>
                                <TextInput
                                    value={customStartDate}
                                    onChangeText={setCustomStartDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.customRangeInput}
                                />
                            </View>
                            <View style={styles.customRangeField}>
                                <Text style={styles.customRangeLabel}>End Date</Text>
                                <TextInput
                                    value={customEndDate}
                                    onChangeText={setCustomEndDate}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor="#9CA3AF"
                                    style={styles.customRangeInput}
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Type Filter */}
                <View style={styles.section}>
                    <View style={styles.typeFilterRow}>
                        <TypeChip
                            label="All"
                            active={filterType === 'all'}
                            onPress={() => setFilterType('all')}
                        />
                        <TypeChip
                            label="Credit"
                            active={filterType === 'income'}
                            onPress={() => setFilterType('income')}
                        />
                        <TypeChip
                            label="Debit"
                            active={filterType === 'expense'}
                            onPress={() => setFilterType('expense')}
                        />
                    </View>
                </View>

                {/* Transactions list */}
                <View style={styles.transactionsList}>
                    {filteredTransactions.map((transaction) => {
                        const color =
                            categoryColors[transaction.category] || '#14B8A6';
                        const isIncome = transaction.type === 'income';

                        return (
                            <View
                                key={transaction.id}
                                style={styles.transactionCard}
                            >
                                <View
                                    style={[
                                        styles.transactionIconWrapper,
                                        { backgroundColor: `${color}20` },
                                    ]}
                                >
                                    {isIncome ? (
                                        <TrendingUp size={20} color={color} />
                                    ) : (
                                        <TrendingDown size={20} color={color} />
                                    )}
                                </View>

                                <View style={styles.transactionInfo}>
                                    <Text style={styles.transactionName}>
                                        {transaction.name}
                                    </Text>
                                    <View style={styles.transactionMetaRow}>
                                        <View
                                            style={[
                                                styles.categoryChip,
                                                {
                                                    backgroundColor: `${color}20`,
                                                    borderColor: `${color}40`,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.categoryChipText,
                                                    { color },
                                                ]}
                                            >
                                                {transaction.category}
                                            </Text>
                                        </View>
                                        <Text style={styles.dot}>•</Text>
                                        <Text style={styles.transactionMetaText}>
                                            {transaction.date}
                                        </Text>
                                        <Text style={styles.dot}>•</Text>
                                        <Text style={styles.transactionMetaText}>
                                            {transaction.time}
                                        </Text>
                                    </View>
                                </View>

                                <Text
                                    style={[
                                        styles.transactionAmount,
                                        isIncome && styles.transactionAmountIncome,
                                    ]}
                                >
                                    {isIncome ? '+' : '-'}$
                                    {transaction.amount.toFixed(2)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

        </View>
    );
}

interface ChipProps {
    label: string;
    active: boolean;
    onPress: () => void;
}

const FilterChip: React.FC<ChipProps> = ({ label, active, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.filterChip,
                active && styles.filterChipActive,
            ]}
        >
            <Text
                style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const TypeChip: React.FC<ChipProps> = ({ label, active, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.typeChip,
                active && styles.typeChipActive,
            ]}
        >
            <Text
                style={[
                    styles.typeChipText,
                    active && styles.typeChipTextActive,
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

// styles unchanged…
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    scrollContent: {
        paddingBottom: 24,
    },
    headerContainer: {
        backgroundColor: '#0f766e',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    summaryLabel: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.85)',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    searchContainer: {
        marginTop: 4,
    },
    searchIcon: {
        position: 'absolute',
        left: 14,
        top: 14,
        zIndex: 1,
    },
    searchInput: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingLeft: 44,
        paddingRight: 16,
        paddingVertical: 10,
        fontSize: 14,
        color: '#111827',
    },
    bodyContainer: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    section: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151',
    },
    dateFilterRow: {
        paddingRight: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#0d9488',
        borderColor: '#0d9488',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    customRangeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginTop: 8,
    },
    customRangeField: {
        marginBottom: 8,
    },
    customRangeLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
        marginBottom: 4,
    },
    customRangeInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 14,
        color: '#111827',
    },
    typeFilterRow: {
        flexDirection: 'row',
        gap: 8,
    },
    typeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        marginRight: 8,
    },
    typeChipActive: {
        backgroundColor: '#0d9488',
        borderColor: '#0d9488',
    },
    typeChipText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#374151',
    },
    typeChipTextActive: {
        color: '#FFFFFF',
    },
    transactionsList: {
        paddingBottom: 16,
    },
    transactionCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 12,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginBottom: 10,
        alignItems: 'center',
    },
    transactionIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    transactionInfo: {
        flex: 1,
    },
    transactionName: {
        fontSize: 15,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    transactionMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    categoryChip: {
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 11,
        fontWeight: '500',
    },
    dot: {
        fontSize: 12,
        color: '#6B7280',
    },
    transactionMetaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    transactionAmount: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 8,
    },
    transactionAmountIncome: {
        color: '#16A34A',
    },
});
