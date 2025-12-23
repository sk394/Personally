// import { useMemo, useState } from 'react';
// import { Card, CardContent, CardHeader, CardHeading } from '@/components/ui/card';
// import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
// import { Area, ComposedChart, Line, XAxis, YAxis } from 'recharts';
// import { formatCurrency, formatDate } from '@/lib/utils';

// // Payment type from the loan data
// export interface PaymentData {
//     id: string;
//     amount: number;
//     paymentDate: Date | string;
//     principalPaid: number;
//     interestPaid: number;
//     paymentMethod: string;
//     notes?: string | null;
//     createdBy?: string;
// }

// interface PaymentChartProps {
//     payments: PaymentData[];
//     principalAmount: number;
//     loanDate: Date | string;
//     type: 'borrowed' | 'lent';
//     hasInterest?: boolean;
//     interestRate?: number | null;
// }

// const chartConfig = {
//     totalPaid: {
//         label: 'Total Paid',
//         color: 'hsl(264, 82%, 70%)',
//     },
//     remainingBalance: {
//         label: 'Remaining',
//         color: 'hsl(172, 82%, 60%)',
//     },
// } satisfies ChartConfig;

// // Custom Tooltip with payment details
// interface TooltipProps {
//     active?: boolean;
//     payload?: Array<{
//         dataKey: string;
//         value: number;
//         color: string;
//         payload: ChartDataPoint;
//     }>;
//     label?: string;
// }

// interface ChartDataPoint {
//     label: string;
//     totalPaid: number;
//     remainingBalance: number;
//     paymentAmount?: number;
//     paymentMethod?: string;
//     paymentNotes?: string | null;
//     paymentDate?: string;
//     isPayment?: boolean;
// }

// const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
//     if (active && payload && payload.length) {
//         const data = payload[0]?.payload;
//         const uniquePayload = payload.filter(
//             (entry, index, self) => index === self.findIndex((item) => item.dataKey === entry.dataKey),
//         );

//         return (
//             <div className="rounded-lg bg-zinc-800 border border-zinc-700 text-white p-3 shadow-lg min-w-[180px]">
//                 <div className="text-xs text-zinc-400 mb-2">{label}</div>
//                 {uniquePayload.map((entry, index) => (
//                     <div key={index} className="flex items-center gap-2 mb-1">
//                         <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
//                         <span className="text-sm text-zinc-300">
//                             {entry.dataKey === 'totalPaid' ? 'Total Paid' : 'Remaining'}:
//                         </span>
//                         <span className="font-semibold">{formatCurrency(entry.value)}</span>
//                     </div>
//                 ))}
//                 {/* Payment details if this point is a payment */}
//                 {data?.isPayment && (
//                     <div className="mt-2 pt-2 border-t border-zinc-700 space-y-1">
//                         <div className="text-xs text-zinc-400">Payment Details</div>
//                         {data.paymentAmount && (
//                             <div className="text-sm">
//                                 <span className="text-zinc-400">Amount: </span>
//                                 <span className="font-medium">{formatCurrency(data.paymentAmount)}</span>
//                             </div>
//                         )}
//                         {data.paymentMethod && (
//                             <div className="text-sm">
//                                 <span className="text-zinc-400">Method: </span>
//                                 <span className="font-medium capitalize">{data.paymentMethod}</span>
//                             </div>
//                         )}
//                         {data.paymentNotes && (
//                             <div className="text-sm">
//                                 <span className="text-zinc-400">Notes: </span>
//                                 <span className="text-zinc-300">{data.paymentNotes}</span>
//                             </div>
//                         )}
//                     </div>
//                 )}
//             </div>
//         );
//     }
//     return null;
// };

// // Period configuration
// const PERIODS = {
//     day: { key: 'day', label: 'Day' },
//     week: { key: 'week', label: 'Week' },
//     month: { key: 'month', label: 'Month' },
// } as const;

// type PeriodKey = keyof typeof PERIODS;

// export default function PaymentChart({
//     payments,
//     principalAmount,
//     loanDate,
//     type,
//     hasInterest,
//     interestRate,
// }: PaymentChartProps) {
//     const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('month');

//     // Process payments into chart data
//     const chartData = useMemo(() => {
//         const sortedPayments = [...payments].sort(
//             (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
//         );

//         const data: ChartDataPoint[] = [];
//         let cumulativePaid = 0;
//         const startDate = new Date(loanDate);

//         // Add starting point
//         data.push({
//             label: formatDate(startDate),
//             totalPaid: 0,
//             remainingBalance: principalAmount,
//             isPayment: false,
//         });

//         // Add each payment as a data point
//         sortedPayments.forEach((payment) => {
//             cumulativePaid += Number(payment.amount);
//             const remaining = Math.max(principalAmount - cumulativePaid, 0);

//             data.push({
//                 label: payment.paymentDate.toLocaleString(),
//                 totalPaid: cumulativePaid,
//                 remainingBalance: remaining,
//                 paymentAmount: Number(payment.amount),
//                 paymentMethod: payment.paymentMethod,
//                 paymentNotes: payment.notes,
//                 paymentDate: payment.paymentDate.toLocaleString(),
//                 isPayment: true,
//             });
//         });

//         // Filter based on period
//         const now = new Date();
//         let cutoffDate = new Date(loanDate);

//         if (selectedPeriod === 'day') {
//             cutoffDate = new Date(now);
//             cutoffDate.setDate(cutoffDate.getDate() - 1);
//         } else if (selectedPeriod === 'week') {
//             cutoffDate = new Date(now);
//             cutoffDate.setDate(cutoffDate.getDate() - 7);
//         } else if (selectedPeriod === 'month') {
//             cutoffDate = new Date(now);
//             cutoffDate.setMonth(cutoffDate.getMonth() - 1);
//         }

//         // For 'month' period, show all data if loan is less than a month old
//         if (data.length > 0) {
//             const loanStartDate = new Date(loanDate);
//             if (now.getTime() - loanStartDate.getTime() < 30 * 24 * 60 * 60 * 1000) {
//                 return data;
//             }
//         }

//         return data.filter((point, index) => {
//             if (index === 0) return true;
//             return true;
//         });
//     }, [payments, principalAmount, loanDate, selectedPeriod]);

//     // Calculate current stats
//     const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
//     const remainingBalance = Math.max(principalAmount - totalPaid, 0);

//     return (
//         <Card className="w-full rounded-3xl bg-zinc-950 border-zinc-800 text-white">
//             <CardHeader className="min-h-auto gap-5 p-6 lg:p-8 border-0">
//                 <CardHeading className="flex flex-wrap items-end gap-5">
//                     <div className="min-w-40 space-y-0.5 me-2.5">
//                         <div className="text-sm text-zinc-400 mb-1">Principal Amount</div>
//                         <div className="text-2xl lg:text-3xl leading-none font-bold">{formatCurrency(principalAmount)}</div>
//                     </div>
//                     <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
//                         <div className="space-y-0.5 pe-6 lg:pe-10">
//                             <div
//                                 className="text-[11px] font-normal flex items-center gap-1.5"
//                                 style={{ color: chartConfig.totalPaid.color }}
//                             >
//                                 <div
//                                     className="size-1.5 rounded-full"
//                                     style={{ backgroundColor: chartConfig.totalPaid.color }}
//                                 />
//                                 Total Paid
//                             </div>
//                             <div className="text-lg lg:text-xl font-bold leading-none">
//                                 {formatCurrency(totalPaid)}
//                             </div>
//                         </div>

//                         <div className="space-y-0.5">
//                             <div
//                                 className="text-[11px] font-normal flex items-center gap-1.5"
//                                 style={{ color: chartConfig.remainingBalance.color }}
//                             >
//                                 <div
//                                     className="size-1.5 rounded-full"
//                                     style={{ backgroundColor: chartConfig.remainingBalance.color }}
//                                 />
//                                 Remaining
//                             </div>
//                             <div className="text-lg lg:text-xl font-bold leading-none">
//                                 {formatCurrency(remainingBalance)}
//                             </div>
//                         </div>

//                         {hasInterest && interestRate && (
//                             <div className="space-y-0.5 ps-6 lg:ps-10">
//                                 <div className="text-[11px] font-normal flex items-center gap-1.5 text-amber-400">
//                                     <div className="size-1.5 rounded-full bg-amber-400" />
//                                     Interest Rate
//                                 </div>
//                                 <div className="text-lg lg:text-xl font-bold leading-none text-amber-400">
//                                     {(interestRate * 100).toFixed(2)}%
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//                 </CardHeading>
//             </CardHeader>

//             <CardContent className="ps-2.5 pe-4.5 pb-6">
//                 <div className="h-[300px] lg:h-[400px] w-full">
//                     <ChartContainer
//                         config={chartConfig}
//                         className="h-full w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
//                     >
//                         <ComposedChart
//                             data={chartData}
//                             margin={{
//                                 top: 25,
//                                 right: 15,
//                                 left: 5,
//                                 bottom: 25,
//                             }}
//                             style={{ overflow: 'visible' }}
//                         >
//                             <defs>
//                                 {/* Grid pattern */}
//                                 <pattern id="gridPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
//                                     <path
//                                         d="M 30 0 L 0 0 0 30"
//                                         fill="none"
//                                         stroke="rgb(51 65 85)"
//                                         strokeWidth="0.5"
//                                         strokeOpacity="0.3"
//                                     />
//                                 </pattern>

//                                 {/* Linear gradients for areas */}
//                                 <linearGradient id="paidAreaGradient" x1="0" y1="0" x2="0" y2="1">
//                                     <stop offset="0%" stopColor={chartConfig.totalPaid.color} stopOpacity="0.3" />
//                                     <stop offset="100%" stopColor={chartConfig.totalPaid.color} stopOpacity="0.02" />
//                                 </linearGradient>

//                                 <linearGradient id="remainingAreaGradient" x1="0" y1="0" x2="0" y2="1">
//                                     <stop offset="0%" stopColor={chartConfig.remainingBalance.color} stopOpacity="0.3" />
//                                     <stop offset="100%" stopColor={chartConfig.remainingBalance.color} stopOpacity="0.02" />
//                                 </linearGradient>

//                                 {/* Shadow filters for dots */}
//                                 <filter id="dotShadow" x="-100%" y="-100%" width="300%" height="300%">
//                                     <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" />
//                                 </filter>
//                                 <filter id="activeDotShadow" x="-100%" y="-100%" width="300%" height="300%">
//                                     <feDropShadow dx="3" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.6)" />
//                                 </filter>
//                             </defs>

//                             {/* Background grid */}
//                             <rect
//                                 x="0"
//                                 y="0"
//                                 width="100%"
//                                 height="100%"
//                                 fill="url(#gridPattern)"
//                                 style={{ pointerEvents: 'none' }}
//                             />

//                             <XAxis
//                                 dataKey="label"
//                                 axisLine={false}
//                                 tickLine={false}
//                                 tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
//                                 tickMargin={15}
//                                 interval="preserveStartEnd"
//                             />

//                             <YAxis
//                                 axisLine={false}
//                                 tickLine={false}
//                                 tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
//                                 tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
//                                 domain={[0, 'dataMax + 100']}
//                                 tickMargin={10}
//                                 width={50}
//                             />

//                             <ChartTooltip content={<CustomTooltip />} />

//                             {/* Area fills with gradients */}
//                             <Area
//                                 type="monotone"
//                                 dataKey="totalPaid"
//                                 stroke="transparent"
//                                 fill="url(#paidAreaGradient)"
//                                 strokeWidth={0}
//                                 dot={false}
//                             />

//                             <Area
//                                 type="monotone"
//                                 dataKey="remainingBalance"
//                                 stroke="transparent"
//                                 fill="url(#remainingAreaGradient)"
//                                 strokeWidth={0}
//                                 dot={false}
//                             />

//                             {/* Line strokes on top */}
//                             <Line
//                                 type="monotone"
//                                 dataKey="totalPaid"
//                                 stroke={chartConfig.totalPaid.color}
//                                 strokeWidth={2}
//                                 dot={{
//                                     r: 4,
//                                     fill: chartConfig.totalPaid.color,
//                                     stroke: 'white',
//                                     strokeWidth: 2,
//                                     filter: 'url(#dotShadow)',
//                                 }}
//                                 activeDot={{
//                                     r: 6,
//                                     fill: chartConfig.totalPaid.color,
//                                     strokeWidth: 2,
//                                     stroke: 'white',
//                                     filter: 'url(#activeDotShadow)',
//                                 }}
//                             />

//                             <Line
//                                 type="monotone"
//                                 dataKey="remainingBalance"
//                                 stroke={chartConfig.remainingBalance.color}
//                                 strokeWidth={2}
//                                 dot={{
//                                     r: 4,
//                                     fill: chartConfig.remainingBalance.color,
//                                     stroke: 'white',
//                                     strokeWidth: 2,
//                                     filter: 'url(#dotShadow)',
//                                 }}
//                                 activeDot={{
//                                     r: 6,
//                                     fill: chartConfig.remainingBalance.color,
//                                     strokeWidth: 2,
//                                     stroke: 'white',
//                                     filter: 'url(#activeDotShadow)',
//                                 }}
//                             />
//                         </ComposedChart>
//                     </ChartContainer>
//                 </div>
//             </CardContent>
//         </Card>
//     );
// }
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardHeading } from '@/components/ui/card'
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart'
import { Area, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { formatCurrency, formatDate } from '@/lib/utils'

// Payment type from the loan data
export interface PaymentData {
    id: string
    amount: number
    paymentDate: Date | string
    principalPaid: number
    interestPaid: number
    paymentMethod: string
    notes?: string | null
    createdBy?: string
}

interface PaymentChartProps {
    payments: PaymentData[]
    principalAmount: number
    loanDate: Date | string
    type: 'borrowed' | 'lent'
    hasInterest?: boolean
    interestRate?: number | null
}

const chartConfig = {
    paymentAmount: {
        label: 'Payment',
        color: 'hsl(264, 82%, 70%)',
    },
} satisfies ChartConfig

// Chart point (one point per payment)
interface ChartDataPoint {
    label: string
    paymentAmount: number
    paymentMethod?: string
    paymentNotes?: string | null
    paymentDate?: string
    isPayment?: boolean
}

// Custom Tooltip with payment details
interface TooltipProps {
    active?: boolean
    payload?: Array<{
        dataKey: string
        value: number
        color: string
        payload: ChartDataPoint
    }>
    label?: string
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload

    return (
        <div className="rounded-lg bg-zinc-800 border border-zinc-700 text-white p-3 shadow-lg min-w-[180px]">
            <div className="text-xs text-zinc-400 mb-2">{label}</div>

            <div className="text-sm">
                <span className="text-zinc-400">Amount: </span>
                <span className="font-semibold">{formatCurrency(d.paymentAmount)}</span>
            </div>

            {d.paymentMethod && (
                <div className="text-sm">
                    <span className="text-zinc-400">Method: </span>
                    <span className="font-medium capitalize">{d.paymentMethod}</span>
                </div>
            )}

            {d.paymentNotes && (
                <div className="text-sm">
                    <span className="text-zinc-400">Notes: </span>
                    <span className="text-zinc-300">{d.paymentNotes}</span>
                </div>
            )}
        </div>
    )
}

// Period configuration (kept, but filtering is optional)
const PERIODS = {
    day: { key: 'day', label: 'Day' },
    week: { key: 'week', label: 'Week' },
    month: { key: 'month', label: 'Month' },
} as const

type PeriodKey = keyof typeof PERIODS

export default function PaymentChart({
    payments,
    principalAmount,
    loanDate,
    type,
    hasInterest,
    interestRate,
}: PaymentChartProps) {
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('month')

    const chartData = useMemo(() => {
        const sortedPayments = [...payments].sort(
            (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
        )

        // Build one data point per payment (only ONE series in chart: paymentAmount)
        const data: ChartDataPoint[] = sortedPayments.map((p) => {
            const d = new Date(p.paymentDate)
            return {
                label: formatDate(d), // nice x-axis label
                paymentAmount: Number(p.amount),
                paymentMethod: p.paymentMethod,
                paymentNotes: p.notes,
                paymentDate: d.toLocaleString(),
                isPayment: true,
            }
        })

        // Optional period filter
        const now = new Date()
        let cutoff = new Date(loanDate)

        if (selectedPeriod === 'day') {
            cutoff = new Date(now)
            cutoff.setDate(cutoff.getDate() - 1)
        } else if (selectedPeriod === 'week') {
            cutoff = new Date(now)
            cutoff.setDate(cutoff.getDate() - 7)
        } else if (selectedPeriod === 'month') {
            cutoff = new Date(now)
            cutoff.setMonth(cutoff.getMonth() - 1)
        }

        // If loan is less than a month old, show all
        const loanStart = new Date(loanDate)
        if (now.getTime() - loanStart.getTime() < 30 * 24 * 60 * 60 * 1000) {
            return data
        }

        return data.filter((pt) => {
            // label is a formatted string, so compare using paymentDate if available
            const t = pt.paymentDate ? new Date(pt.paymentDate).getTime() : now.getTime()
            return t >= cutoff.getTime()
        })
    }, [payments, loanDate, selectedPeriod])

    // Stats for header (unchanged)
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0)
    const remainingBalance = Math.max(principalAmount - totalPaid, 0)

    return (
        <Card className="w-full rounded-3xl bg-zinc-950 border-zinc-800 text-white">
            <CardHeader className="min-h-auto gap-5 p-6 lg:p-8 border-0">
                <CardHeading className="flex flex-wrap items-end gap-5">
                    <div className="min-w-40 space-y-0.5 me-2.5">
                        <div className="text-sm text-zinc-400 mb-1">Principal Amount</div>
                        <div className="text-2xl lg:text-3xl leading-none font-bold">
                            {formatCurrency(principalAmount)}
                        </div>
                    </div>

                    <div className="flex items-center flex-wrap gap-2.5 mb-1.5">
                        <div className="space-y-0.5 pe-6 lg:pe-10">
                            <div
                                className="text-[11px] font-normal flex items-center gap-1.5"
                                style={{ color: chartConfig.paymentAmount.color }}
                            >
                                <div
                                    className="size-1.5 rounded-full"
                                    style={{ backgroundColor: chartConfig.paymentAmount.color }}
                                />
                                Total Paid
                            </div>
                            <div className="text-lg lg:text-xl font-bold leading-none">
                                {formatCurrency(totalPaid)}
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            <div className="text-[11px] font-normal flex items-center gap-1.5 text-zinc-300">
                                <div className="size-1.5 rounded-full bg-zinc-500" />
                                Remaining
                            </div>
                            <div className="text-lg lg:text-xl font-bold leading-none">
                                {formatCurrency(remainingBalance)}
                            </div>
                        </div>

                        {hasInterest && interestRate && (
                            <div className="space-y-0.5 ps-6 lg:ps-10">
                                <div className="text-[11px] font-normal flex items-center gap-1.5 text-amber-400">
                                    <div className="size-1.5 rounded-full bg-amber-400" />
                                    Interest Rate
                                </div>
                                <div className="text-lg lg:text-xl font-bold leading-none text-amber-400">
                                    {(interestRate * 100).toFixed(2)}%
                                </div>
                            </div>
                        )}
                    </div>
                </CardHeading>
            </CardHeader>

            <CardContent className="ps-2.5 pe-4.5 pb-6">
                <div className="h-[300px] lg:h-[400px] w-full">
                    <ChartContainer
                        config={chartConfig}
                        className="h-full w-full overflow-visible [&_.recharts-curve.recharts-tooltip-cursor]:stroke-initial"
                    >
                        <ComposedChart
                            data={chartData}
                            margin={{
                                top: 25,
                                right: 15,
                                left: 5,
                                bottom: 25,
                            }}
                            style={{ overflow: 'visible' }}
                        >
                            <defs>
                                {/* Grid pattern */}
                                <pattern id="gridPattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                                    <path
                                        d="M 30 0 L 0 0 0 30"
                                        fill="none"
                                        stroke="rgb(51 65 85)"
                                        strokeWidth="0.5"
                                        strokeOpacity="0.3"
                                    />
                                </pattern>

                                {/* Linear gradient for area */}
                                <linearGradient id="paymentAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={chartConfig.paymentAmount.color} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={chartConfig.paymentAmount.color} stopOpacity="0.02" />
                                </linearGradient>

                                {/* Shadow filters for dots */}
                                <filter id="dotShadow" x="-100%" y="-100%" width="300%" height="300%">
                                    <feDropShadow dx="2" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.4)" />
                                </filter>
                                <filter id="activeDotShadow" x="-100%" y="-100%" width="300%" height="300%">
                                    <feDropShadow dx="3" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.6)" />
                                </filter>
                            </defs>

                            {/* Background grid */}
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#gridPattern)" style={{ pointerEvents: 'none' }} />

                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                                tickMargin={15}
                                interval="preserveStartEnd"
                            />

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fill: 'rgb(148 163 184)' }}
                                tickFormatter={(value) => formatCurrency(Number(value))}
                                domain={[0, 'dataMax + 10']}
                                tickMargin={10}
                                width={70}
                            />

                            <ChartTooltip content={<CustomTooltip />} />

                            {/* ONE area + ONE line: paymentAmount */}
                            <Area
                                type="monotone"
                                dataKey="paymentAmount"
                                stroke="transparent"
                                fill="url(#paymentAreaGradient)"
                                strokeWidth={0}
                                dot={false}
                            />

                            <Line
                                type="monotone"
                                dataKey="paymentAmount"
                                stroke={chartConfig.paymentAmount.color}
                                strokeWidth={2}
                                dot={{
                                    r: 4,
                                    fill: chartConfig.paymentAmount.color,
                                    stroke: 'white',
                                    strokeWidth: 2,
                                    filter: 'url(#dotShadow)',
                                }}
                                activeDot={{
                                    r: 6,
                                    fill: chartConfig.paymentAmount.color,
                                    strokeWidth: 2,
                                    stroke: 'white',
                                    filter: 'url(#activeDotShadow)',
                                }}
                            />
                        </ComposedChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    )
}
