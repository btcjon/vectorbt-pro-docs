Signals are an additional level of abstraction added on top of orders: instead of specifying every bit of information on what needs to be ordered at each timestamp, we can first decide on what a typical order should look like, and then choose the timing of issuing such an order. The latter decision process can be realized through signals, which in the vectorbt's world are represented by a boolean mask where `True` means "order" and `False` means "no order". Additionally, we can change the meaning of each signal statically, or dynamically based on the current simulation state; for example, we can instruct the simulator to ignore an "order" signal if we're already in the market, which cannot be done by using the "from-orders" method alone. Finally, vectorbt loves data science, and so comparing multiple strategies with the same trading conditions but different signal permutations (i.e., order timings and directions) is much easier, less error-prone, and generally leads to fairer experiments.

Since we constantly buy and sell things, the ideal scenario would be to incorporate an order direction into each signal as well. But we cannot represent three states ("order to buy", "order to sell", and "no order") by using booleans - a data type with just two values. Thus, signals are usually distributed across two or more boolean arrays, where each array represents a different decision dimension. The most popular way to define signals is by using two direction-unaware arrays: ![1⃣](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/31-20e3.svg ":one:") entries and ![2⃣](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/32-20e3.svg ":two:") exits. Those two arrays have a different meaning based on the direction specified using a separate variable. For instance, when only the long direction is enabled, an entry signal opens a new long position and an exit signal closes it; when both directions are enabled, an entry signal opens a new long position and an exit signal reverses it to open a short one. To better control the decision on whether to reverse the current position or just close it out, we can define four direction-aware arrays: ![1⃣](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/31-20e3.svg ":one:") long entries, ![2⃣](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/32-20e3.svg ":two:") long exits, ![3⃣](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/33-20e3.svg ":three:") short entries, and ![4⃣](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/34-20e3.svg ":four:") short exits, which guarantees the most flexibility.

For example, to open a long position, close it, open a short position, and reverse it, the signals would look like this:

The same strategy can be also defined using an entry signal, an exit signal, and a direction:

Info

Direction-unaware signals can be easily translated into direction-aware signals:

-   True, True, Long only True, True, False, False
-   True, True, Short only False, False, True, True
-   True, True, Both True, False, True, False

But direction-aware signals cannot be translated into direction-unaware signals if both directions are enabled and there is an exit signal present:

-   False, True, False, True ![❓](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/2753.svg ":question:")

Thus, we need to evaluate in detail which conditions we're interested in before generating signals.

But why not choosing an integer data type where a positive number means "order to buy", negative number means "order to sell", and zero means "no order", like done in backtrader, for example? Boolean arrays are much easier to generate and maintain by the user, but also, a boolean NumPy array requires 8x less memory than a 64-bit signed integer NumPy array. Furthermore, it's so much more convenient to combine and analyze masks than integer arrays! For example, we can use the _logical OR_ (`|` in NumPy) operation to combine two masks, or sum the elements in a mask to get the number of signals since booleans are a subtype of integers and behave just like regular integers in most math expressions.

## Comparison[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#comparison "Permanent link")

Generating signals properly can sometimes be orders of magnitude more difficult than simulating them. This is because we have to take into account not only their distribution, but also how they interact across multiple boolean arrays. For example, setting both an entry and an exit at the same timestamp will effectively eliminate both. That's why vectorbt deploys numerous functions and techniques to support us in this regard.

Signal generation usually starts with comparing two or more numeric arrays. Remember that by comparing entire arrays, we're iterating over each row and column (= element) in a vectorized manner, and compare their scalar values at that one element. So, essentially, we're just running the same comparison operation on each single element across all the arrays that are being compared together. Let's start our first example with Bollinger Bands run on two separate assets. At each timestamp, we'll place a signal whenever the low price is below the lower band, with an expectation that the price will reverse back to its rolling mean:

```
>>> from vectorbtpro import *

>>> data = vbt.BinanceData.pull(
...     ["BTCUSDT", "ETHUSDT"], 
...     start="2021-01-01",
...     end="2022-01-01"
... )
>>> data.get("Low")
symbol                      BTCUSDT  ETHUSDT
Open time                                   
2021-01-01 00:00:00+00:00  28624.57   714.29
2021-01-02 00:00:00+00:00  28946.53   714.91
2021-01-03 00:00:00+00:00  31962.99   768.71
...                             ...      ...
2021-12-29 00:00:00+00:00  46096.99  3604.20
2021-12-30 00:00:00+00:00  45900.00  3585.00
2021-12-31 00:00:00+00:00  45678.00  3622.29

[365 rows x 2 columns]

>>> bb = vbt.talib("BBANDS").run(
...     data.get("Close"),
...     timeperiod=vbt.Default(14),  
...     nbdevup=vbt.Default(2),
...     nbdevdn=vbt.Default(2)
... )
>>> bb.lowerband  
symbol                          BTC-USD      ETH-USD
Date                                                
2021-04-23 00:00:00+00:00           NaN          NaN
2021-04-24 00:00:00+00:00           NaN          NaN
2021-04-25 00:00:00+00:00           NaN          NaN
...                                 ...          ...
2022-04-21 00:00:00+00:00  38987.326323  2912.894415
2022-04-22 00:00:00+00:00  38874.059308  2898.681307
2022-04-23 00:00:00+00:00  38915.417003  2903.756905

[366 rows x 2 columns]

>>> mask = data.get("Low") < bb.lowerband  
>>> mask
symbol                     BTCUSDT  ETHUSDT
Open time                                  
2021-01-01 00:00:00+00:00    False    False
2021-01-02 00:00:00+00:00    False    False
2021-01-03 00:00:00+00:00    False    False
...                            ...      ...
2021-12-29 00:00:00+00:00    False     True
2021-12-30 00:00:00+00:00    False     True
2021-12-31 00:00:00+00:00    False    False

[365 rows x 2 columns]

>>> mask.sum()  
symbol
BTCUSDT    36
ETHUSDT    28
dtype: int64

```

This operation has generated a mask that has a true value whenever the low price dips below the lower band. Such an array can already be used in simulation! But let's see what happens when we try to compare the lower band that has been generated for multiple combinations of the (upper and lower) multiplier:

```
>>> bb_mult = vbt.talib("BBANDS").run(
...     data.get("Close"),
...     timeperiod=vbt.Default(14),
...     nbdevup=[2, 3],
...     nbdevdn=[2, 3]  
... )
>>> mask = data.get("Low") < bb_mult.lowerband
ValueError: Can only compare identically-labeled DataFrame objects

```

The problem lies in Pandas being unable to compare DataFrames with different columns - the left DataFrame contains the columns `BTCUSDT` and `ETHUSDT` while the right DataFrame coming from the Bollinger Bands indicator now contains the columns `(2, 2, BTCUSDT)`, `(2, 2, ETHUSDT)`, `(3, 3, BTCUSDT)`, and `(3, 3, ETHUSDT)`. So, what's the solution? Right - vectorbt! By appending `vbt` to the _left_ operand, we are comparing the accessor object of type [BaseAccessor](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor) instead of the DataFrame itself. This will trigger the so-called [magic method](https://rszalski.github.io/magicmethods/) `__lt__` of that accessor, which takes the DataFrame under the accessor and the DataFrame on the right, and combines them with [BaseAccessor.combine](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.combine) and [numpy.less](https://numpy.org/doc/stable/reference/generated/numpy.less.html) as `combine_func`. This, in turn, will broadcast the shapes and indexes of both DataFrames using the vectorbt's powerful broadcasting mechanism, effectively circumventing the limitation of Pandas.

As the result, vectorbt will compare `(2, 2, BTCUSDT)` and `(3, 3, BTCUSDT)` only with `BTCUSDT` and `(2, 2, ETHSDT)` and `(3, 3, ETHSDT)` only with `ETHSDT`, and this using NumPy - faster!

```
>>> mask = data.get("Low").vbt < bb_mult.lowerband  
>>> mask
bbands_nbdevup                          2               3
bbands_nbdevdn                          2               3
symbol                    BTCUSDT ETHUSDT BTCUSDT ETHUSDT
Open time                                                
2021-01-01 00:00:00+00:00   False   False   False   False
2021-01-02 00:00:00+00:00   False   False   False   False
2021-01-03 00:00:00+00:00   False   False   False   False
...                           ...     ...     ...     ...
2021-12-29 00:00:00+00:00   False    True   False   False
2021-12-30 00:00:00+00:00   False    True   False   False
2021-12-31 00:00:00+00:00   False   False   False   False

[365 rows x 4 columns]

>>> mask.sum()
bbands_nbdevup  bbands_nbdevdn  symbol 
2               2               BTCUSDT    53
                                ETHUSDT    48
3               3               BTCUSDT    10
                                ETHUSDT     9
dtype: int64

```

Note

For vectorbt to be able to compare shapes that are not broadcastable, both DataFrames must have at least one column level in common, such as `symbol` that we had above.

As you might have recalled from the documentation on indicators, each indicator attaches a couple of helper methods for comparison - `{name}_above`, `{name}_equal`, and `{name}_below`, which do basically the same as we did above:

```
>>> mask = bb_mult.lowerband_above(data.get("Low"))  
>>> mask.sum()
bbands_nbdevup  bbands_nbdevdn  symbol 
2               2               BTCUSDT    53
                                ETHUSDT    48
3               3               BTCUSDT    10
                                ETHUSDT     9
dtype: int64

```

### Thresholds[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#thresholds "Permanent link")

To compare a numeric array against two or more scalar thresholds (making them parameter combinations), we can use the same approach by either appending `vbt`, or by calling the method [BaseAccessor.combine](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.combine). Let's calculate the bandwidth of our single-combination indicator, which is the upper band minus the lower band divided by the middle band, and check whether it's higher than two different thresholds:

```
>>> bandwidth = (bb.upperband - bb.lowerband) / bb.middleband

>>> mask = bandwidth.vbt > vbt.Param([0.15, 0.3], name="threshold")  
>>> mask.sum()
threshold  symbol 
0.15       BTCUSDT    253
           ETHUSDT    316
0.30       BTCUSDT     65
           ETHUSDT    136
dtype: int64

>>> mask = bandwidth.vbt.combine(
...     [0.15, 0.3],  
...     combine_func=np.greater, 
...     keys=pd.Index([0.15, 0.3], name="threshold")  
... )
>>> mask.sum()
threshold  symbol 
0.15       BTCUSDT    253
           ETHUSDT    316
0.30       BTCUSDT     65
           ETHUSDT    136
dtype: int64

```

The latest example works also on arrays instead of scalars. Or, we can use [pandas.concat](https://pandas.pydata.org/docs/reference/api/pandas.concat.html) to manually stack the results of any comparison to treat them as separate combinations:

```
>>> mask = pd.concat(
...     (bandwidth > 0.15, bandwidth > 0.3), 
...     keys=pd.Index([0.15, 0.3], name="threshold"), 
...     axis=1
... )
>>> mask.sum()
threshold  symbol 
0.15       BTCUSDT    253
           ETHUSDT    316
0.30       BTCUSDT     65
           ETHUSDT    136
dtype: int64

```

### Crossovers[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#crossovers "Permanent link")

So far we have touched basic vectorized comparison operations, but there is one operation that comes disproportionally often in technical analysis: crossovers. A crossover refers to a situation where two time series cross each other. There are two ways of finding the crossovers: naive and native. The naive approach compares both time series in a vectorized manner and then selects the first `True` value out of each "partition" of `True` values. A partition in the vectorbt's vocabulary for signal processing is just a bulk of consecutive `True` values produced by the comparison. While we already know how to do the first operation, the second one can be achieved with the help of the accessor for signals - [SignalsAccessor](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor), accessible via the attribute `vbt.signals` on any Pandas object.

In particular, we will be using the method [SignalsAccessor.first](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.first), which takes a mask, assigns a rank to each `True` value in each partition using [SignalsAccessor.pos\_rank](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.pos_rank) (enumerated from 0 to the length of the respective partition), and then keeps only those `True` values that have the rank 0. Let's get the crossovers of the lower price dipping below the lower band:

```
>>> low_below_lband = data.get("Low") < bb.lowerband
>>> mask = low_below_lband.vbt.signals.first()
>>> mask.sum()
symbol
BTCUSDT    21
ETHUSDT    20
dtype: int64

```

To make sure that the operation was successful, let's plot the `BTCUSDT` column of both time series using [GenericAccessor.plot](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.plot) and the generated signals using [SignalsSRAccessor.plot\_as\_markers](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsSRAccessor.plot_as_markers):

```
>>> btc_low = data.get("Low", "BTCUSDT").rename("Low")  
>>> btc_lowerband = bb.lowerband["BTCUSDT"].rename("Lower Band")
>>> btc_mask = mask["BTCUSDT"].rename("Signals")

>>> fig = btc_low.vbt.plot()  
>>> btc_lowerband.vbt.plot(fig=fig)
>>> btc_mask.vbt.signals.plot_as_markers(
...     y=btc_low, 
...     trace_kwargs=dict(
...         marker=dict(
...             color="#DFFF00"
...         )
...     ),
...     fig=fig
... )  
>>> fig.show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/crossovers.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/crossovers.dark.svg#only-dark)

Hint

To wait for a confirmation, use [SignalsAccessor.nth](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.nth) to select the n-th signal in each partition.

But here's the catch: if the first low value is already below the first lower band value, it will also yield a crossover signal. To fix that, we need to pass `after_false=True`, which will discard the first partition if there is no `False` value before it.

```
>>> mask = low_below_lband.vbt.signals.first(after_false=True)
>>> mask.sum()
symbol
BTCUSDT    21
ETHUSDT    20
dtype: int64

```

And here's another catch: if the first bunch of values in the indicator are NaN, which results in `False` values in the mask, and the first value after the last NaN yields `True`, then the `after_false` argument becomes ineffective. To account for this, we need to manually set those values in the mask to `True`. Let's illustrate this issue on sample data:

```
>>> sample_low = pd.Series([10, 9, 8, 9, 8])
>>> sample_lband = pd.Series([np.nan, np.nan, 9, 8, 9])
>>> sample_mask = sample_low < sample_lband
>>> sample_mask.vbt.signals.first(after_false=True)  
0    False
1    False
2     True
3    False
4     True
dtype: bool

>>> sample_mask[sample_lband.ffill().isnull()] = True  
>>> sample_mask.vbt.signals.first(after_false=True)
0    False
1    False
2    False
3    False
4     True
dtype: bool

```

Or, we can remove the buffer, do the operation, and then add the buffer back:

```
>>> buffer = sample_lband.ffill().isnull().sum(axis=0).max()  
>>> buffer
2

>>> sample_buf_mask = sample_low.iloc[buffer:] < sample_lband.iloc[buffer:]
>>> sample_buf_mask = sample_buf_mask.vbt.signals.first(after_false=True)
>>> sample_mask = sample_low.vbt.wrapper.fill(False)
>>> sample_mask.loc[sample_buf_mask.index] = sample_buf_mask
>>> sample_mask
0    False
1    False
2    False
3    False
4     True
dtype: bool

```

Info

We can apply the buffer-exclusive approach introduced above to basically any operation in vectorbt.

But here comes another issue: what happens if our data contains gaps and we encounter a NaN in the middle of a partition? We should make the second part of the partition `False` as forward-filling that NaN value would make waiting for a confirmation problematic. But also, doing so many operations on bigger arrays just for getting the crossovers is quite resource-expensive. Gladly, vectorbt deploys its own Numba-compiled function [crossed\_above\_nb](https://vectorbt.pro/pvt_40509f46/api/generic/nb/base/#vectorbtpro.generic.nb.base.crossed_above_nb) for finding the crossovers in an iterative manner, which is the second, native way. To use this function, we can use the methods [GenericAccessor.crossed\_above](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.crossed_above) and [GenericAccessor.crossed\_below](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.crossed_below), accessible via the attribute `vbt` on any Pandas object:

```
>>> mask = data.get("Low").vbt.crossed_below(bb.lowerband, wait=1)  
>>> mask.sum()
symbol
BTCUSDT    15
ETHUSDT    11
dtype: int64

```

Info

If the time series crosses back during the confirmation period `wait`, the signal won't be set. To set the signal anyway, use forward shifting.

As with other comparison methods, each indicator has the helper methods `{name}_crossed_above` and `{name}_crossed_below` for generating the crossover masks:

```
>>> mask = bb.lowerband_crossed_above(data.get("Low"), wait=1)
>>> mask.sum()
symbol
BTCUSDT    15
ETHUSDT    11
dtype: int64

```

## Logical operators[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#logical-operators "Permanent link")

Once we've generated two or more masks (conditions), we can combine them into a single mask using logical operators. Common logical operators include

-   _AND_ (`&` or [numpy.logical\_and](https://numpy.org/doc/stable/reference/generated/numpy.logical_and.html)): for each element, returns True whenever all the conditions are True
-   _OR_ (`|` or [numpy.logical\_or](https://numpy.org/doc/stable/reference/generated/numpy.logical_or.html)): for each element, returns True whenever any of the conditions are True
-   _NOT_ (`~` or [numpy.logical\_not](https://numpy.org/doc/stable/reference/generated/numpy.logical_not.html)): for each element, returns True whenever the condition is False
-   _XOR_ (`^` or [numpy.logical\_xor](https://numpy.org/doc/stable/reference/generated/numpy.logical_xor.html)): for each element, returns True whenever only one of the conditions is True

Note

Do not use `and`, `or`, or `not` on arrays - they only work on single boolean values! For example, instead of `mask1 and mask2` use `mask1 & mask2`, instead of `mask1 or mask2` use `mask1 | mask2`, and instead of `not mask` use `~mask`.

For example, let's combine four conditions for a signal: the low price dips below the lower band _AND_ the bandwidth is above some threshold (= a downward breakout while expanding), _OR_, the high price rises above the upper band _AND_ the bandwidth is below some threshold (= an upward breakout while squeezing):

```
>>> cond1 = data.get("Low") < bb.lowerband
>>> cond2 = bandwidth > 0.3
>>> cond3 = data.get("High") > bb.upperband
>>> cond4 = bandwidth < 0.15

>>> mask = (cond1 & cond2) | (cond3 & cond4)
>>> mask.sum()
symbol
BTCUSDT    25
ETHUSDT    13
dtype: int64

```

To test multiple thresholds and to broadcast exclusively using vectorbt:

```
>>> cond1 = data.get("Low").vbt < bb.lowerband
>>> cond2 = bandwidth.vbt > vbt.Param([0.3, 0.3, 0.4, 0.4], name="cond2_th")  
>>> cond3 = data.get("High").vbt > bb.upperband
>>> cond4 = bandwidth.vbt < vbt.Param([0.1, 0.2, 0.1, 0.2], name="cond4_th")  

>>> mask = (cond1.vbt & cond2).vbt | (cond3.vbt & cond4)  
>>> mask.sum()
cond2_th  cond4_th  symbol 
0.3       0.1       BTCUSDT    11
                    ETHUSDT    10
          0.2       BTCUSDT    28
                    ETHUSDT    27
0.4       0.1       BTCUSDT     9
                    ETHUSDT     5
          0.2       BTCUSDT    26
                    ETHUSDT    22
dtype: int64

```

### Cartesian product[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#cartesian-product "Permanent link")

Combining two or more arrays using a Cartesian product is a bit more complex since every array has the column level `symbol` that shouldn't be combined with itself. But here's the trick. First, convert the columns of each array into their integer positions. Then, split each position array into "blocks" (smaller arrays). Blocks will be combined with each other, but the positions within each block won't; that is, each block acts as a parameter combination. Combine then all blocks using a combinatorial function of choice (see [itertools](https://docs.python.org/3/library/itertools.html) for various options, or [generate\_param\_combs](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.generate_param_combs)), and finally, flatten each array with blocks and use it for column selection. Sounds complex? Yes. Difficult to implement? No!

```
>>> cond1 = data.get("Low").vbt < bb.lowerband
>>> cond2 = bandwidth.vbt > vbt.Param([0.3, 0.4], name="cond2_th")  
>>> cond3 = data.get("High").vbt > bb.upperband
>>> cond4 = bandwidth.vbt < vbt.Param([0.1, 0.2], name="cond4_th")

>>> i1 = np.split(np.arange(len(cond1.columns)), len(cond1.columns) // 2)  
>>> i2 = np.split(np.arange(len(cond2.columns)), len(cond2.columns) // 2)
>>> i3 = np.split(np.arange(len(cond3.columns)), len(cond3.columns) // 2)
>>> i4 = np.split(np.arange(len(cond4.columns)), len(cond4.columns) // 2)

>>> i1
[array([0, 1])]
>>> i2
[array([0, 1]), array([2, 3])]
>>> i3
[array([0, 1])]
>>> i4
[array([0, 1]), array([2, 3])]

>>> i1, i2, i3, i4 = zip(*product(i1, i2, i3, i4))  

>>> i1
(array([0, 1]), array([0, 1]), array([0, 1]), array([0, 1]))
>>> i2
(array([0, 1]), array([0, 1]), array([2, 3]), array([2, 3]))
>>> i3
(array([0, 1]), array([0, 1]), array([0, 1]), array([0, 1]))
>>> i4
(array([0, 1]), array([2, 3]), array([0, 1]), array([2, 3]))

>>> i1 = np.asarray(i1).flatten()  
>>> i2 = np.asarray(i2).flatten()
>>> i3 = np.asarray(i3).flatten()
>>> i4 = np.asarray(i4).flatten()

>>> i1
[0 1 0 1 0 1 0 1]
>>> i2
[0 1 0 1 2 3 2 3]
>>> i3
[0 1 0 1 0 1 0 1]
>>> i4
[0 1 2 3 0 1 2 3]

>>> cond1 = cond1.iloc[:, i1]  
>>> cond2 = cond2.iloc[:, i2]
>>> cond3 = cond3.iloc[:, i3]
>>> cond4 = cond4.iloc[:, i4]

>>> mask = (cond1.vbt & cond2).vbt | (cond3.vbt & cond4)  
>>> mask.sum()
cond2_th  cond4_th  symbol 
0.3       0.1       BTCUSDT    11
                    ETHUSDT    10
          0.2       BTCUSDT    28
                    ETHUSDT    27
0.4       0.1       BTCUSDT     9
                    ETHUSDT     5
          0.2       BTCUSDT    26
                    ETHUSDT    22
dtype: int64

```

In newer versions of VBT the same effect can be achieved with a single call of [BaseAccessor.cross](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.cross):

```
>>> cond1 = data.get("Low").vbt < bb.lowerband
>>> cond2 = bandwidth.vbt > vbt.Param([0.3, 0.4], name="cond2_th")
>>> cond3 = data.get("High").vbt > bb.upperband
>>> cond4 = bandwidth.vbt < vbt.Param([0.1, 0.2], name="cond4_th")

>>> cond1, cond2, cond3, cond4 = vbt.pd_acc.x(cond1, cond2, cond3, cond4)  
>>> mask = (cond1.vbt & cond2).vbt | (cond3.vbt & cond4)

```

But probably an easier and less error-prone approach would be to build an indicator that would handle parameter combinations for us ![😁](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f601.svg ":grin:")

For this, we will write an indicator expression similar to the code we wrote for a single parameter combination, and use [IndicatorFactory.from\_expr](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.from_expr) to auto-build an indicator by parsing that expression. The entire logic including the specification of all inputs, parameters, and outputs is encapsulated in the expression itself. We'll use the annotation `@res_talib_bbands` to resolve the specification of the inputs and parameters expected by the TA-Lib's `BBANDS` indicator and "copy" them over to our indicator by also prepending the prefix `talib` to the parameter names. Then, we will perform our usual signal generation logic by substituting the custom parameters `cond2_th` and `cond4_th` with their single values, and return the whole thing as an output `mask` annotated accordingly.

```
>>> MaskGenerator = vbt.IF.from_expr("""
... upperband, middleband, lowerband = @res_talib_bbands
... bandwidth = (upperband - lowerband) / middleband
... cond1 = low < lowerband
... cond2 = bandwidth > @p_cond2_th
... cond3 = high > upperband
... cond4 = bandwidth < @p_cond4_th
... @out_mask:(cond1 & cond2) | (cond3 & cond4)
... """)

>>> vbt.phelp(MaskGenerator.run, incl_doc=False)  
Indicator.run(
    high,
    low,
    close,
    cond2_th,
    cond4_th,
    bbands_timeperiod=Default(value=5),
    bbands_nbdevup=Default(value=2),
    bbands_nbdevdn=Default(value=2),
    bbands_matype=Default(value=0),
    bbands_timeframe=Default(value=None),
    short_name='custom',
    hide_params=None,
    hide_default=True,
    **kwargs
)

>>> mask_generator = MaskGenerator.run(
...     high=data.get("High"),
...     low=data.get("Low"),
...     close=data.get("Close"),
...     cond2_th=[0.3, 0.4],
...     cond4_th=[0.1, 0.2],
...     bbands_timeperiod=vbt.Default(14),
...     param_product=True
... )  
>>> mask_generator.mask.sum()
custom_cond2_th  custom_cond4_th  symbol 
0.3              0.1              BTCUSDT    11
                                  ETHUSDT    10
                 0.2              BTCUSDT    28
                                  ETHUSDT    27
0.4              0.1              BTCUSDT     9
                                  ETHUSDT     5
                 0.2              BTCUSDT    26
                                  ETHUSDT    22
dtype: int64

```

Info

Even though the indicator factory has "indicator" in its name, we can use it to generate signals just as well. This is because signals are just boolean arrays that also guarantee to be of the input shape.

## Shifting[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#shifting "Permanent link")

To compare the current value to any previous (not future!) value, we can use forward shifting. Also, we can use it to shift the final mask to postpone the order execution. For example, let's generate a signal whenever the low price dips below the lower band _AND_ the bandwidth change (i.e., the difference between the current and the previous bandwidth) is positive:

```
>>> cond1 = data.get("Low") < bb.lowerband
>>> cond2 = bandwidth > bandwidth.shift(1)  

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    42
ETHUSDT    39
dtype: int64

```

Another way to shift observations is by selecting the first observation in a rolling window. This is particularly useful when the rolling window has a variable size, for example, based on a frequency. Let's do the same as above but determine the change in the bandwidth in relation to one week ago instead of yesterday:

```
>>> cond2 = bandwidth > bandwidth.rolling("7d").apply(lambda x: x[0])

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    33
ETHUSDT    28
dtype: int64

```

Hint

Using variable windows instead of fixed ones should be preferred if your data has gaps.

The approach above is a move in the right direction, but it introduces two potential issues: all windows will be either 6 days long or less, while the performance of rolling and applying such a custom Python function using Pandas is not satisfactory, to say the least. The first issue can be solved by rolling a window of 8 days, and checking the timestamp of the first observation being exactly 7 days behind the current timestamp:

```
>>> def exactly_ago(sr):  
...     if sr.index[0] == sr.index[-1] - vbt.timedelta("7d"):
...         return sr.iloc[0]
...     return np.nan

>>> cond_7d_ago = bandwidth.rolling("8d").apply(exactly_ago, raw=False)
>>> cond2 = bandwidth > cond_7d_ago

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    29
ETHUSDT    26
dtype: int64

```

The second issue can be solved by looping with Numba. However, the main challenge lies in solving those two issues simultaneously because we want to access the timestamp of the first observation, which requires us to work on a Pandas Series instead of a NumPy array, and Numba cannot work on Pandas Series ![😑](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f611.svg ":expressionless:")

Thus, we will use the vectorbt's accessor method [GenericAccessor.rolling\_apply](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.rolling_apply), which offers two modes: regular and meta. The regular mode rolls over the data of a Pandas object just like Pandas does it, and does not give us any information about the current window ![🙅](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f645.svg ":no_good:") The meta mode rolls over the **metadata** of a Pandas object, so we can easily select the data from any array corresponding to the current window ![👌](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f44c.svg ":ok_hand:")

```
>>> @njit
... def exactly_ago_meta_nb(from_i, to_i, col, index, freq, arr):  
...     if index[from_i] == index[to_i - 1] - freq:  
...         return arr[from_i, col]  
...     return np.nan

>>> cond_7d_ago = vbt.pd_acc.rolling_apply(
...     "8d",
...     exactly_ago_meta_nb,
...     bandwidth.index.values,  
...     vbt.timedelta("7d").to_timedelta64(),
...     vbt.to_2d_array(bandwidth),
...     wrapper=bandwidth.vbt.wrapper  
... )
>>> cond2 = bandwidth > cond_7d_ago

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    29
ETHUSDT    26
dtype: int64

```

And if this approach (rightfully) intimidates you, there is a dead simple method [GenericAccessor.ago](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.ago), which is capable of forward-shifting the array using any delta:

```
>>> cond2 = bandwidth > bandwidth.vbt.ago("7d")

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    29
ETHUSDT    26
dtype: int64

>>> bandwidth.iloc[-8]
symbol
BTCUSDT    0.125477
ETHUSDT    0.096458
Name: 2021-12-24 00:00:00+00:00, dtype: float64

>>> bandwidth.vbt.ago("7d").iloc[-1]
symbol
BTCUSDT    0.125477
ETHUSDT    0.096458
Name: 2021-12-31 00:00:00+00:00, dtype: float64

```

Hint

This method returns exact matches. In a case where the is no exact match, the value will be NaN. To return the previous index value instead, pass `method="ffill"`. The method also accepts a sequence of deltas that will be applied on the per-element basis.

## Truth value testing[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#truth-value-testing "Permanent link")

But what if we want to test whether a certain condition was met during a certain period of time in the past? For this, we need to create an expanding or a rolling window, and do truth value testing using [numpy.any](https://numpy.org/doc/stable/reference/generated/numpy.any.html) or [numpy.all](https://numpy.org/doc/stable/reference/generated/numpy.all.html) within this window. But since Pandas doesn't implement the rolling aggregation using `any` and `all`, we need to be more creative and treat booleans as integers: use `max` for a logical _OR_ and `min` for a logical _AND_. Also, don't forget to cast the resulting array to a boolean data type to generate a valid mask.

Let's place a signal whenever the low price goes below the lower band _AND_ there was a downward crossover of the close price with the middle band in the past 5 candles:

```
>>> cond2 = data.get("Close").vbt.crossed_below(bb.middleband)
>>> cond2 = cond2.rolling(5, min_periods=1).max().astype(bool)

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    36
ETHUSDT    28
dtype: int64

```

Note

Be cautious when setting `min_periods` to a higher number and converting to a boolean data type: each NaN will become `True`. Thus, at least replace NaNs with zeros before casting.

If the window size is fixed, we can also use [GenericAccessor.rolling\_any](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.rolling_any) and [GenericAccessor.rolling\_all](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.rolling_all), which are tailored for computing rolling truth testing operations:

```
>>> cond2 = data.get("Close").vbt.crossed_below(bb.middleband)
>>> cond2 = cond2.vbt.rolling_any(5)

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    36
ETHUSDT    28
dtype: int64

```

Another way of doing the same rolling operations is by using the accessor method [GenericAccessor.rolling\_apply](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.rolling_apply) and specifying `reduce_func_nb` as "any" or "all" string. We should use the argument `wrap_kwargs` to instruct vectorbt to fill NaNs with `False` and change the data type. This method allows flexible windows to be passed. Again, let's roll a window of 5 days:

```
>>> cond2 = data.get("Close").vbt.crossed_below(bb.middleband)
>>> cond2 = cond2.vbt.rolling_apply(
...     "5d", "any",  
...     minp=1, 
...     wrap_kwargs=dict(fillna=0, dtype=bool)
... )

>>> mask = cond1 & cond2
>>> mask.sum()
symbol
BTCUSDT    36
ETHUSDT    28
dtype: int64

```

Let's do something more complex: check whether the bandwidth contracted to 10% or less at any point during a month using an expanding window, and reset the window at the beginning of the next month; this way, we make the first timestamp of the month a time anchor for our condition. For this, we'll overload the vectorbt's resampling logic, which allows aggregating values by mapping any source index (anchor points in our example) to any target index (our index).

```
>>> anchor_points = data.wrapper.get_index_points(  
...     every="M", 
...     start=0,  
...     exact_start=True
... )
>>> anchor_points
array([  0,  31,  59,  90, 120, 151, 181, 212, 243, 273, 304, 334])

>>> left_bound = np.full(len(data.wrapper.index), np.nan)  
>>> left_bound[anchor_points] = anchor_points
>>> left_bound = vbt.dt.to_ns(vbt.nb.ffill_1d_nb(left_bound))
>>> left_bound = bandwidth.index[left_bound]
>>> left_bound
DatetimeIndex(['2021-01-01 00:00:00+00:00', '2021-01-01 00:00:00+00:00',
               '2021-01-01 00:00:00+00:00', '2021-01-01 00:00:00+00:00',
               '2021-01-01 00:00:00+00:00', '2021-01-01 00:00:00+00:00',
               ...
               '2021-12-01 00:00:00+00:00', '2021-12-01 00:00:00+00:00',
               '2021-12-01 00:00:00+00:00', '2021-12-01 00:00:00+00:00',
               '2021-12-01 00:00:00+00:00', '2021-12-01 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', ...)

>>> right_bound = data.wrapper.index  
>>> right_bound
DatetimeIndex(['2021-01-01 00:00:00+00:00', '2021-01-02 00:00:00+00:00',
               '2021-01-03 00:00:00+00:00', '2021-01-04 00:00:00+00:00',
               '2021-01-05 00:00:00+00:00', '2021-01-06 00:00:00+00:00',
               ...
               '2021-12-26 00:00:00+00:00', '2021-12-27 00:00:00+00:00',
               '2021-12-28 00:00:00+00:00', '2021-12-29 00:00:00+00:00',
               '2021-12-30 00:00:00+00:00', '2021-12-31 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', ...)

>>> mask = (bandwidth <= 0.1).vbt.resample_between_bounds(  
...     left_bound, 
...     right_bound,
...     "any",
...     closed_lbound=True,  
...     closed_rbound=True,
...     wrap_kwargs=dict(fillna=0, dtype=bool)
... )
>>> mask.index = right_bound
>>> mask.astype(int).vbt.ts_heatmap().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ts_heatmap.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ts_heatmap.dark.svg#only-dark)

We can observe how the signal for the bandwidth touching the 10% mark propagates through each month, and then the calculation gets reset and repeated.

## Periodically[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#periodically "Permanent link")

To set signals periodically, such as at 18:00 of each Tuesday, we have multiple options. The first approach involves comparing various attributes of the source and target datetime. For example, to get the timestamps that correspond to each Tuesday, we can compare [pandas.DatetimeIndex.weekday](https://pandas.pydata.org/docs/reference/api/pandas.DatetimeIndex.weekday.html#pandas.DatetimeIndex.weekday) to 1 (Monday is 0 and Sunday is 6):

```
>>> min_data = vbt.BinanceData.pull(  
...     ["BTCUSDT", "ETHUSDT"], 
...     start="2021-01-01 UTC",  
...     end="2021-02-01 UTC",
...     timeframe="1h"
... )
>>> index = min_data.wrapper.index
>>> tuesday_index = index[index.weekday == 1]
>>> tuesday_index
DatetimeIndex(['2021-01-05 00:00:00+00:00', '2021-01-05 01:00:00+00:00',
               '2021-01-05 02:00:00+00:00', '2021-01-05 03:00:00+00:00',
               '2021-01-05 04:00:00+00:00', '2021-01-05 05:00:00+00:00',
               ...
               '2021-01-26 18:00:00+00:00', '2021-01-26 19:00:00+00:00',
               '2021-01-26 20:00:00+00:00', '2021-01-26 21:00:00+00:00',
               '2021-01-26 22:00:00+00:00', '2021-01-26 23:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Now, we need to select only those timestamps that happen at one specific time:

```
>>> tuesday_1800_index = tuesday_index[tuesday_index.hour == 18]
>>> tuesday_1800_index
DatetimeIndex(['2021-01-05 18:00:00+00:00', '2021-01-12 18:00:00+00:00',
               '2021-01-19 18:00:00+00:00', '2021-01-26 18:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Since each attribute comparison produces a mask, we can get our signals by pure logical operations. Let's get the timestamps that correspond to each Tuesday 17:30 by comparing the weekday of each timestamp to Tuesday _AND_ the hour of each timestamp to 17 _AND_ the minute of each timestamp to 30:

```
>>> tuesday_1730_index = index[
...     (index.weekday == 1) & 
...     (index.hour == 17) & 
...     (index.minute == 30)
... ]
>>> tuesday_1730_index
DatetimeIndex([], dtype='datetime64[ns, UTC]', name='Open time', freq='H')

```

As we see, both conditions combined produced no exact matches because our index is hourly. But what if we wanted to get the previous or next timestamp if there was no exact match? Clearly, the approach above wouldn't work. Instead, we'll use the function [pandas.Index.get\_indexer](https://pandas.pydata.org/docs/reference/api/pandas.Index.get_indexer.html), which takes an array with index labels, and searches for their corresponding positions in the index. For example, let's get the position of August 7th in our index:

```
>>> index.get_indexer([vbt.timestamp("2021-01-07", tz=index.tz)])  
array([144])

```

But looking for an index that doesn't exist will return `-1`:

```
>>> index.get_indexer([vbt.timestamp("2021-01-07 17:30:00", tz=index.tz)]) 
array([-1])

```

Warning

Do not pass the result for indexing if there is a possibility of no match. For example, if any of the returned positions is `-1` and it's used in timestamp selection, the position will be replaced by the latest timestamp in the index.

To get either the exact match or the previous one, we can pass `method='ffill'`. Conversely, to get the next one, we can pass `method='bfill'`:

```
>>> index[index.get_indexer(
...     [vbt.timestamp("2021-01-07 17:30:00", tz=index.tz)],
...     method="ffill"
... )]
DatetimeIndex(['2021-01-07 17:00:00+00:00'], ...)

>>> index[index.get_indexer(
...     [vbt.timestamp("2021-01-07 17:30:00", tz=index.tz)],
...     method="bfill"
... )]
DatetimeIndex(['2021-01-07 18:00:00+00:00'], ...)

```

Returning to our example, we need first to generate the target index for our query, which we're about to search in the source index: use the function [pandas.date\_range](https://pandas.pydata.org/docs/reference/api/pandas.date_range.html) to get the timestamp of each Tuesday midnight, and then add a timedelta of 17 hours and 30 minutes. Next, transform the target index into positions (row indices) at which our signals will be placed. Then, we extract the Pandas symbol wrapper from our data instance and use it to fill a new mask that has the same number of columns as we have symbols. Finally, set `True` at the generated positions of that mask:

```
>>> each_tuesday = vbt.date_range(index[0], index[-1], freq="tuesday")  
>>> each_tuesday_1730 = each_tuesday + pd.Timedelta(hours=17, minutes=30)  
>>> each_tuesday_1730
DatetimeIndex(['2021-01-05 17:30:00+00:00', '2021-01-12 17:30:00+00:00',
               '2021-01-19 17:30:00+00:00', '2021-01-26 17:30:00+00:00'],
              dtype='datetime64[ns, UTC]', freq=None)

>>> positions = index.get_indexer(each_tuesday_1730, method="bfill")

>>> min_symbol_wrapper = min_data.get_symbol_wrapper()  
>>> mask = min_symbol_wrapper.fill(False)  
>>> mask.iloc[positions] = True  
>>> mask.sum()
symbol
BTCUSDT    4
ETHUSDT    4
dtype: int64

```

Let's make sure that all signals match 18:00 on Tuesday, which is the first date after the requested 17:30 on Tuesday in an hourly index:

```
>>> mask[mask.any(axis=1)].index.strftime("%A %T")  
Index(['Tuesday 18:00:00', 'Tuesday 18:00:00', 'Tuesday 18:00:00',
       'Tuesday 18:00:00'],
      dtype='object', name='Open time')

```

The above solution is only required when only a single time boundary is known. For example, if we want 17:30 on Tuesday or later, we know only the left boundary while the right boundary is infinity (or we might get no data point after this datetime at all). When both time boundaries are known, we can easily use the first approach and combine it with the vectorbt's signal selection mechanism. For example, let's place a signal at 17:00 on Tuesday or later, but not later than 17:00 on Wednesday. This would require us placing signals from the left boundary all the way to the right boundary, and then selecting the first signal out of that partition:

```
>>> tuesday_after_1700 = (index.weekday == 1) & (index.hour >= 17)
>>> wednesday_before_1700 = (index.weekday == 2) & (index.hour < 17)
>>> main_cond = tuesday_after_1700 | wednesday_before_1700
>>> mask = min_symbol_wrapper.fill(False)
>>> mask[main_cond] = True
>>> mask = mask.vbt.signals.first()
>>> mask[mask.any(axis=1)].index.strftime("%A %T")
Index(['Tuesday 17:00:00', 'Tuesday 17:00:00', 'Tuesday 17:00:00',
       'Tuesday 17:00:00'],
      dtype='object', name='Open time')

```

The third and final approach is the vectorbt's one ![❤️🔥](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/2764-fe0f-200d-1f525.svg ":heart_on_fire:")

It's relying on the two accessor methods [BaseAccessor.set](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.set) and [BaseAccessor.set\_between](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.set_between), which allow us to conditionally set elements of an array in a more intuitive manner.

Place a signal at 17:30 each Tuesday or later:

```
>>> mask = min_symbol_wrapper.fill(False)
>>> mask.vbt.set(
...     True, 
...     every="tuesday", 
...     at_time="17:30", 
...     inplace=True
... )
>>> mask[mask.any(axis=1)].index.strftime("%A %T")
Index(['Tuesday 18:00:00', 'Tuesday 18:00:00', 'Tuesday 18:00:00',
       'Tuesday 18:00:00'],
      dtype='object', name='Open time')

```

Place a signal after 18:00 each Tuesday (exclusive):

```
>>> mask = min_symbol_wrapper.fill(False)
>>> mask.vbt.set(
...     True, 
...     every="tuesday", 
...     at_time="18:00", 
...     add_delta=pd.Timedelta(nanoseconds=1),  
...     inplace=True
... )
>>> mask[mask.any(axis=1)].index.strftime("%A %T")
Index(['Tuesday 19:00:00', 'Tuesday 19:00:00', 'Tuesday 19:00:00',
       'Tuesday 19:00:00'],
      dtype='object', name='Open time')

```

Fill signals between 12:00 each Monday and 17:00 each Tuesday:

```
>>> mask = min_symbol_wrapper.fill(False)
>>> mask.vbt.set_between(
...     True, 
...     every="monday", 
...     start_time="12:00", 
...     end_time="17:00", 
...     add_end_delta=pd.Timedelta(days=1),  
...     inplace=True
... )
>>> mask[mask.any(axis=1)].index.strftime("%A %T")
Index(['Monday 12:00:00', 'Monday 13:00:00', 'Monday 14:00:00',
       'Monday 15:00:00', 'Monday 16:00:00', 'Monday 17:00:00',
       'Monday 18:00:00', 'Monday 19:00:00', 'Monday 20:00:00',
       ...
       'Tuesday 10:00:00', 'Tuesday 11:00:00', 'Tuesday 12:00:00',
       'Tuesday 13:00:00', 'Tuesday 14:00:00', 'Tuesday 15:00:00',
       'Tuesday 16:00:00'],
      dtype='object', name='Open time', length=116)

```

Place a signal exactly at the midnight of January 7th, 2021:

```
>>> mask = min_symbol_wrapper.fill(False)
>>> mask.vbt.set(
...     True, 
...     on="January 7th 2021 UTC",  
...     indexer_method=None,  
...     inplace=True
... )
>>> mask[mask.any(axis=1)].index
DatetimeIndex(['2021-01-07 00:00:00+00:00'], ...)

```

Fill signals between 12:00 on January 1st/7th and 12:00 on January 2nd/8th, 2021:

```
>>> mask = min_symbol_wrapper.fill(False)
>>> mask.vbt.set_between(
...     True, 
...     start=["2021-01-01 12:00:00", "2021-01-07 12:00:00"],  
...     end=["2021-01-02 12:00:00", "2021-01-08 12:00:00"],
...     inplace=True
... )
>>> mask[mask.any(axis=1)].index
DatetimeIndex(['2021-01-01 12:00:00+00:00', '2021-01-01 13:00:00+00:00',
               '2021-01-01 14:00:00+00:00', '2021-01-01 15:00:00+00:00',
               '2021-01-01 16:00:00+00:00', '2021-01-01 17:00:00+00:00',
               ...
               '2021-01-08 06:00:00+00:00', '2021-01-08 07:00:00+00:00',
               '2021-01-08 08:00:00+00:00', '2021-01-08 09:00:00+00:00',
               '2021-01-08 10:00:00+00:00', '2021-01-08 11:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Fill signals in the first 2 hours of each week:

```
>>> mask = min_symbol_wrapper.fill(False)
>>> mask.vbt.set_between(
...     True, 
...     every="monday",
...     split_every=False,  
...     add_end_delta="2h",
...     inplace=True
... )
>>> mask[mask.any(axis=1)].index
DatetimeIndex(['2021-01-04 00:00:00+00:00', '2021-01-04 01:00:00+00:00',
               '2021-01-11 00:00:00+00:00', '2021-01-11 01:00:00+00:00',
               '2021-01-18 00:00:00+00:00', '2021-01-18 01:00:00+00:00',
               '2021-01-25 00:00:00+00:00', '2021-01-25 01:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

See the API documentation for more examples.

## Iteratively[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#iteratively "Permanent link")

With Numba, we can write an iterative logic that performs just as well as its vectorized counterparts. But which approach is better? There is no clear winner, although using vectors is an overall more effective and user-friendlier approach because it abstracts away looping over data and automates various mechanisms associated with index and columns. Just think about how powerful the concept of broadcasting is, and how many more lines of code it would require implementing something similar iteratively. Numba also doesn't allow us to work with labels and complex data types, only with numeric data, which requires skills and creativity in designing (efficient!) algorithms.

Moreover, most vectorized and also non-vectorized but compiled functions are specifically tailored at one specific task and perform it reliably, while writing an own loop makes **you** responsible to implement every bit of the logic correctly. Vectors are like Lego bricks that require almost zero effort to construct even the most breathtaking castles, while custom loops require learning how to design each Lego brick first ![🧱](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f9f1.svg ":bricks:")

Nevertheless, the most functionality in vectorbt is powered by loops, not vectors - we should rename vectorbt to loopbt, really ![😬](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f62c.svg ":grimacing:") The main reason is plain and simple: most of the operations cannot be realized through vectors because they either introduce path dependencies, require complex data structures, use intermediate calculations or data buffers, periodically need to call a third-party function, or all of these together. Another reason is certainly efficiency: we can design algorithms that loop of the data [only once](https://en.wikipedia.org/wiki/One-pass_algorithm), while performing the same logic using vectors would read the whole data sometimes a dozen of times. The same goes for memory consumption! Finally, defining and running a strategy at each time step is exactly how we would proceed in the real world (and in any other backtesting framework too), and we as traders should strive to mimic the real world as closely as possible.

Enough talking! Let's implement the first example from [Logical operators](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#logical-operators) using a custom loop. Unless our signals are based on multiple assets or some other column grouping, we should always start with one column only:

```
>>> @njit  
... def generate_mask_1d_nb(  
...     high, low,  
...     uband, mband, lband,  
...     cond2_th, cond4_th  
... ):
...     out = np.full(high.shape, False)  
...     
...     for i in range(high.shape[0]):  
...         
...         bandwidth = (uband[i] - lband[i]) / mband[i]
...         cond1 = low[i] < lband[i]
...         cond2 = bandwidth > cond2_th
...         cond3 = high[i] > uband[i]
...         cond4 = bandwidth < cond4_th
...         signal = (cond1 and cond2) or (cond3 and cond4)  
...         out[i] = signal  
...         
...     return out

>>> mask = generate_mask_1d_nb(
...     data.get("High")["BTCUSDT"].values,  
...     data.get("Low")["BTCUSDT"].values,
...     bb.upperband["BTCUSDT"].values,
...     bb.middleband["BTCUSDT"].values,
...     bb.lowerband["BTCUSDT"].values,
...     0.30,
...     0.15
... )
>>> symbol_wrapper = data.get_symbol_wrapper()
>>> mask = symbol_wrapper["BTCUSDT"].wrap(mask)  
>>> mask.sum()
25

```

We've got the same number of signals as previously - magic!

To make the function work on multiple columns, we can then write another Numba-compiled function that iterates over columns and calls `generate_mask_1d_nb` on each:

```
>>> @njit
... def generate_mask_nb(  
...     high, low,
...     uband, mband, lband,
...     cond2_th, cond4_th
... ):
...     out = np.empty(high.shape, dtype=np.bool_)  
...     
...     for col in range(high.shape[1]):  
...         out[:, col] = generate_mask_1d_nb(  
...             high[:, col], low[:, col],
...             uband[:, col], mband[:, col], lband[:, col],
...             cond2_th, cond4_th
...         )
...         
...     return out

>>> mask = generate_mask_nb(
...     vbt.to_2d_array(data.get("High")),  
...     vbt.to_2d_array(data.get("Low")),
...     vbt.to_2d_array(bb.upperband),
...     vbt.to_2d_array(bb.middleband),
...     vbt.to_2d_array(bb.lowerband),
...     0.30,
...     0.15
... )
>>> mask = symbol_wrapper.wrap(mask)
>>> mask.sum()
symbol
BTCUSDT    25
ETHUSDT    13
dtype: int64

```

Probably a more "vectorbtonic" way is to create a stand-alone indicator where we can specify the function and what data it expects and returns, and the indicator factory will take care of everything else for us!

```
>>> MaskGenerator = vbt.IF(  
...     input_names=["high", "low", "uband", "mband", "lband"],
...     param_names=["cond2_th", "cond4_th"],
...     output_names=["mask"]
... ).with_apply_func(generate_mask_1d_nb, takes_1d=True)  
>>> mask_generator = MaskGenerator.run(  
...     data.get("High"),
...     data.get("Low"),
...     bb.upperband,
...     bb.middleband,
...     bb.lowerband,
...     [0.3, 0.4],
...     [0.1, 0.2],
...     param_product=True  
... )
>>> mask_generator.mask.sum()
custom_cond2_th  custom_cond4_th  symbol 
0.3              0.1              BTCUSDT    11
                                  ETHUSDT    10
                 0.2              BTCUSDT    28
                                  ETHUSDT    27
0.4              0.1              BTCUSDT     9
                                  ETHUSDT     5
                 0.2              BTCUSDT    26
                                  ETHUSDT    22
dtype: int64

```

But what about shifting and truth value testing? Simple use cases such as fixed shifts and windows can be implemented quite easily. Below, we're comparing the current value to the value some number of ticks before:

```
>>> @njit
... def value_ago_1d_nb(arr, ago):
...     out = np.empty(arr.shape, dtype=float_)  
...     for i in range(out.shape[0]):
...         if i - ago >= 0:  
...             out[i] = arr[i - ago]
...         else:
...             out[i] = np.nan  
...     return out

>>> arr = np.array([1, 2, 3])
>>> value_ago_1d_nb(arr, 1)
array([nan, 1., 2.])

```

Important

Don't forget to check whether the element you query is within the bounds of the array. Unless you turned on the `NUMBA_BOUNDSCHECK` mode, Numba won't raise an error if you accessed an element that does not exist. Instead, it will quietly proceed with the calculation, and at some point your kernel will probably die. In such a case, just restart the kernel, disable Numba or enable the bounds check, and re-run the function to identify the bug.

And here's how to test if any condition was true inside a fixed window (= variable time interval):

```
>>> @njit
... def any_in_window_1d_nb(arr, window):
...     out = np.empty(arr.shape, dtype=np.bool_)  
...     for i in range(out.shape[0]):
...         from_i = max(0, i + 1 - window)  
...         to_i = i + 1  
...         out[i] = np.any(arr[from_i:to_i])  
...     return out

>>> arr = np.array([False, True, True, False, False])
>>> any_in_window_1d_nb(arr, 2)
array([False, True, True, True, False])

```

As soon as dates and time are involved, such as to compare the current value to the value exactly 5 days ago, a better approach is to pre-calculate as many intermediate steps as possible. But there is also a possibility to work with a datetime-like index in Numba directly. Here's how to test if any condition was true inside a variable window (= fixed time interval):

```
>>> @njit
... def any_in_var_window_1d_nb(arr, index, freq):  
...     out = np.empty(arr.shape, dtype=np.bool_)
...     from_i = 0
...     for i in range(out.shape[0]):
...         if index[from_i] <= index[i] - freq:  
...             for j in range(from_i + 1, index.shape[0]):  
...                 if index[j] > index[i] - freq:
...                     from_i = j
...                     break  
...         to_i = i + 1
...         out[i] = np.any(arr[from_i:to_i])
...     return out

>>> arr = np.array([False, True, True, False, False])
>>> index = vbt.date_range("2020", freq="5min", periods=len(arr)).values  
>>> freq = vbt.timedelta("10min").to_timedelta64()  
>>> any_in_var_window_1d_nb(arr, index, freq)
array([False, True, True, True, False])

```

Hint

Generally, it's easier to design iterative functions using regular Python and only compile them with Numba if they were sufficiently tested, because it's easier to debug things in Python than in Numba.

Remember that Numba (and thus vectorbt) has far more features for processing numeric data than datetime/timedelta data. But gladly, datetime/timedelta data can be safely converted into integer data outside Numba, and many functions will continue to work just as before:

```
>>> any_in_var_window_1d_nb(arr, vbt.dt.to_ns(index), vbt.dt.to_ns(freq))
array([False, True, True, True, False])

```

Why so? By converting a datetime/timedelta into an integer, we're extracting the total number of nanoseconds representing that object. For a datetime, the integer value becomes the number of nanoseconds after the [Unix Epoch](https://en.wikipedia.org/wiki/Unix_time), which is 00:00:00 UTC on 1 January 1970:

```
>>> vbt.dt.to_ns(index)  
array([1577836800000000000, 1577837100000000000, 1577837400000000000,
       1577837700000000000, 1577838000000000000])

>>> vbt.dt.to_ns(index - np.datetime64(0, "ns")) 
array([1577836800000000000, 1577837100000000000, 1577837400000000000,
       1577837700000000000, 1577838000000000000])

>>> vbt.dt.to_ns(freq)  
600000000000

>>> vbt.dt.to_ns(freq) / 1000 / 1000 / 1000 / 60  
10.0

```

## Generators[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#generators "Permanent link")

Writing own loops is powerful and makes fun, but even here vectorbt has functions that may make our life easier, especially for generating signals. The most flexible out of all helper functions is the Numba-compiled function [generate\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.generate_nb) and its accessor class method [SignalsAccessor.generate](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate), which takes a target shape, initializes a boolean output array of that shape and fills it with `False`values, then iterates over the columns, and for each column, it calls a so-called "placement function" - a regular UDF that changes the mask in place. After the change, the placement function should return either the position of the last placed signal or `-1` for no signal.

All the information about the current iteration is being passed via a context of the type [GenEnContext](https://vectorbt.pro/pvt_40509f46/api/signals/enums/#vectorbtpro.signals.enums.GenEnContext), which contains the current segment of the output mask that can be modified in place, the range start (inclusive) that corresponds to that segment, the range end (exclusive), column, but also the full output mask for the user to be able to make patches wherever they want. This way, vectorbt abstracts away both preparing the array and looping over the columns, and assists the user in selecting the right subset of the output data to modify.

Let's place a signal at 17:00 (UTC) of each Tuesday:

```
>>> @njit
... def place_func_nb(c, index):  
...     last_i = -1  
...     for out_i in range(len(c.out)):  
...         i = c.from_i + out_i  
...         weekday = vbt.dt_nb.weekday_nb(index[i])  
...         hour = vbt.dt_nb.hour_nb(index[i])
...         if weekday == 1 and hour == 17:  
...             c.out[out_i] = True  
...             last_i = out_i
...     return last_i  

>>> mask = vbt.pd_acc.signals.generate(  
...     symbol_wrapper.shape,  
...     place_func_nb,
...     vbt.dt.to_ns(symbol_wrapper.index),  
...     wrapper=symbol_wrapper  
... )
>>> mask.sum()
symbol
BTCUSDT    0
ETHUSDT    0
dtype: int64

```

Info

Segments in [generate\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.generate_nb) are always the entire columns.

But our index is a daily index, thus there can't be any signal. Instead, let's place a signal at the next possible timestamp:

```
>>> @njit
... def place_func_nb(c, index):
...     last_i = -1
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         weekday = vbt.dt_nb.weekday_nb(index[i])
...         hour = vbt.dt_nb.hour_nb(index[i])
...         if weekday == 1 and hour == 17:
...             c.out[out_i] = True
...             last_i = out_i
...         else:
...             past_target_midnight = vbt.dt_nb.past_weekday_nb(index[i], 1)  
...             past_target = past_target_midnight + 17 * vbt.dt_nb.h_ns  
...             if (i > 0 and index[i - 1] < past_target) and \
...                 index[i] > past_target:  
...                 c.out[out_i] = True
...                 last_i = out_i
...     return last_i

>>> mask = vbt.pd_acc.signals.generate(
...     symbol_wrapper.shape,
...     place_func_nb,
...     vbt.dt.to_ns(symbol_wrapper.index),
...     wrapper=symbol_wrapper
... )
>>> mask.sum()
symbol
BTCUSDT    52
ETHUSDT    52
dtype: int64

>>> mask.index[mask.any(axis=1)].strftime('%A %m/%d/%Y')  
Index(['Wednesday 01/06/2021', ..., 'Wednesday 12/29/2021'],
      dtype='object', name='Open time')

```

The most fascinating part about the snippet above is that the entire datetime logic is being performed using just regular integers!

Important

When being converted into the integer format, the timezone of each datetime object is effectively converted to UTC, thus make sure that any value compared to the UTC timestamp is also in UTC.

But what about multiple parameter combinations? We cannot pass the function above to the indicator factory because it doesn't look like an apply function. But vectorbt's got our back! There is an entire subclass of the indicator factory tailed at signal generation - [SignalFactory](https://vectorbt.pro/pvt_40509f46/api/signals/factory/#vectorbtpro.signals.factory.SignalFactory). This class supports multiple generation modes that can be specified using the argument `mode` of the type [FactoryMode](https://vectorbt.pro/pvt_40509f46/api/signals/enums/#vectorbtpro.signals.enums.FactoryMode). In our case, the mode is `FactoryMode.Entries` because our function generates signals based on the target shape only, and not based on other signal arrays. Furthermore, the signal factory accepts any additional inputs, parameters, and in-outputs to build the skeleton of our future indicator class.

The signal factory has the class method [SignalFactory.with\_place\_func](https://vectorbt.pro/pvt_40509f46/api/signals/factory/#vectorbtpro.signals.factory.SignalFactory.with_place_func) comparable to `from_apply_func` we've got used to. In fact, it takes a placement function and generates a custom function that does all the pre- and post-processing around [generate\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.generate_nb) (note that other modes have other generation functions). This custom function, for example, prepares the arguments and assigns them to their correct positions in the placement function call. It's then forwarded down to [IndicatorFactory.with\_custom\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_custom_func). As a result, we receive an indicator class with a `run` method that can be applied on any user-defined shape and any grid of parameter combinations. Sounds handy, right?

Let's parametrize our exact-match placement function with two parameters: weekday and hour.

```
>>> @njit
... def place_func_nb(c, weekday, hour, index):  
...     last_i = -1
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         weekday_now = vbt.dt_nb.weekday_nb(index[i])
...         hour_now = vbt.dt_nb.hour_nb(index[i])
...         if weekday_now == weekday and hour_now == hour:
...             c.out[out_i] = True
...             last_i = out_i
...     return last_i

>>> EntryGenerator = vbt.SignalFactory(
...     mode="entries",
...     param_names=["weekday", "hour"]
... ).with_place_func(
...     entry_place_func_nb=place_func_nb,  
...     entry_settings=dict(  
...         pass_params=["weekday", "hour"],
...     ),
...     var_args=True  
... )
>>> entry_generator = EntryGenerator.run(
...     symbol_wrapper.shape,  
...     1, 
...     [0, 17],  
...     vbt.dt.to_ns(symbol_wrapper.index),  
...     input_index=symbol_wrapper.index,  
...     input_columns=symbol_wrapper.columns
... )
>>> entry_generator.entries.sum()
custom_weekday  custom_hour   
1               0            0    52
                             1    52
                17           0     0
                             1     0
dtype: int64

```

Note

The mode `FactoryMode.Entries` doesn't mean that we are forced to generate signals that must strictly act as entries during the simulation - we can generate any mask, also exits if they don't depend on entries.

The indicator function was able to match all midnight times but none afternoon times, which makes sense because our index is daily and thus contains midnight times only. We can easily plot the indicator using the attached `plot` method, which knows how to visualize each mode:

```
>>> entry_generator.plot(column=(2, 0, "BTCUSDT")).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/signal_factory.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/signal_factory.dark.svg#only-dark)

### Exits[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#exits "Permanent link")

After populating the position entry mask, we should decide on the position exit mask. When exits do not rely on entries, we can use the generator introduced above. In other cases though, we might have a logic that makes an exit signal fully depend on the entry signal. For example, an exit signal representing a stop loss exists solely because of the entry signal that defined that stop loss condition. There is also no guarantee that an exit can be found for an entry at all. Thus, this mode should only be used for cases where entries do not depend on exits, but exits depend on entries. The generation is then done using the Numba-compiled function [generate\_ex\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.generate_ex_nb) and its accessor instance method [SignalsAccessor.generate\_exits](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_exits). The passed context is now of the type [GenExContext](https://vectorbt.pro/pvt_40509f46/api/signals/enums/#vectorbtpro.signals.enums.GenExContext) and also includes the input mask and various generator-related arguments.

The generator takes an entry mask array, and in each column, it visits each entry signal and calls a UDF to place one or more exit signals succeeding it. Do you recall how we had to accept `from_i` and `to_i` in the placement functions above? The previous mode always passed `0` as `from_i` and `len(index)` as `to_i` because we had all the freedom to define our signals across the entire column. Here, the passed `from_i` will usually be the next index after the previous entry, while the passed `to_i` will usually be the index of the next entry, thus effectively limiting our decision field to the space between each pair of entries.

Warning

Beware that knowing the position of the next entry signal may introduce the look-ahead bias. Thus, use it only for iteration purposes, and never set data based on `to_i`!

Let's generate an entry each quarter and an exit at the next date:

```
>>> @njit
... def exit_place_func_nb(c):
...     c.out[0] = True  
...     return 0

>>> entries = symbol_wrapper.fill(False)
>>> entries.vbt.set(True, every="Q", inplace=True)
>>> entries.index[entries.any(axis=1)]
DatetimeIndex(['2021-03-31 00:00:00+00:00', '2021-06-30 00:00:00+00:00',
               '2021-09-30 00:00:00+00:00', '2021-12-31 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

>>> exits = entries.vbt.signals.generate_exits(exit_place_func_nb)  
>>> exits.index[exits.any(axis=1)]
DatetimeIndex(['2021-04-01 00:00:00+00:00', '2021-07-01 00:00:00+00:00',
               '2021-10-01 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

We can control the distance to the entry signal using `wait`, which defaults to 1. Let's instruct vectorbt to start each segment at the same timestamp as the entry:

```
>>> exits = entries.vbt.signals.generate_exits(
...     exit_place_func_nb,
...     wait=0
... )
>>> exits.index[exits.any(axis=1)]
DatetimeIndex(['2021-03-31 00:00:00+00:00', '2021-06-30 00:00:00+00:00',
               '2021-09-30 00:00:00+00:00', '2021-12-31 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

And below is how to implement a variable waiting time based on a frequency. Let's wait exactly 7 days before placing an exit:

```
>>> @njit
... def exit_place_func_nb(c, index, wait_td):
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         if index[i] >= index[c.from_i] + wait_td:  
...             return out_i  
...     return -1

>>> exits = entries.vbt.signals.generate_exits(
...     exit_place_func_nb,
...     vbt.dt.to_ns(entries.index),  
...     vbt.dt.to_ns(vbt.timedelta("7d")),
...     wait=0
... )
>>> exits.index[exits.any(axis=1)]
DatetimeIndex(['2021-04-07 00:00:00+00:00', '2021-07-07 00:00:00+00:00',
               '2021-10-07 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

But what happens with the exit condition for the previous entry if the next entry is less than 7 days away? Will the exit still be placed? No!

```
>>> entries = symbol_wrapper.fill(False)
>>> entries.vbt.set(True, every="5d", inplace=True)
>>> exits = entries.vbt.signals.generate_exits(
...     exit_place_func_nb,
...     vbt.dt.to_ns(entries.index),
...     vbt.dt.to_ns(vbt.timedelta("7d")),
...     wait=0
... )
>>> exits.index[exits.any(axis=1)]
DatetimeIndex([], dtype='datetime64[ns, UTC]', name='Open time', freq='D')

```

By default, each segment is limited by the two entries surrounding it. To make it infinite, we can disable `until_next`:

```
>>> exits = entries.vbt.signals.generate_exits(
...     exit_place_func_nb,
...     vbt.dt.to_ns(entries.index),
...     vbt.dt.to_ns(vbt.timedelta("7d")),
...     wait=0,
...     until_next=False
... )
>>> exits.index[exits.any(axis=1)]
DatetimeIndex(['2021-01-08 00:00:00+00:00', '2021-01-13 00:00:00+00:00',
               '2021-01-18 00:00:00+00:00', '2021-01-23 00:00:00+00:00',
               '2021-01-28 00:00:00+00:00', '2021-02-02 00:00:00+00:00',
               ...
               '2021-12-04 00:00:00+00:00', '2021-12-09 00:00:00+00:00',
               '2021-12-14 00:00:00+00:00', '2021-12-19 00:00:00+00:00',
               '2021-12-24 00:00:00+00:00', '2021-12-29 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Note

In such a case, we might be unable to identify which exit belongs to which entry. Moreover, two or more entries may generate an exit at the same timestamp, so beware!

In the case above, the generated signals follow the following schema: `entry1`, `entry2`, `exit1`, `entry3`, `exit2`, and so on. Whenever those signals are passed to the simulator, it will execute `entry1` and ignore `entry2` because there was no exit prior to it - we're still in the market. It will then rightfully execute `exit1`. But then, it will open a new position with `entry3` and close it with `exit2` right after, which was originally designed for `entry2` (that has been ignored). To avoid this mistake, we should enable `skip_until_exit` to avoid processing any future entry signal that comes before an exit for any past entry signal. This would match the simulation order.

```
>>> exits = entries.vbt.signals.generate_exits(
...     exit_place_func_nb,
...     vbt.dt.to_ns(entries.index),
...     vbt.dt.to_ns(vbt.timedelta("7d")),
...     wait=0,
...     until_next=False,
...     skip_until_exit=True
... )
>>> exits.index[exits.any(axis=1)]
DatetimeIndex(['2021-01-08 00:00:00+00:00', '2021-01-18 00:00:00+00:00',
               '2021-01-28 00:00:00+00:00', '2021-02-07 00:00:00+00:00',
               '2021-02-17 00:00:00+00:00', '2021-02-27 00:00:00+00:00',
               ...
               '2021-11-04 00:00:00+00:00', '2021-11-14 00:00:00+00:00',
               '2021-11-24 00:00:00+00:00', '2021-12-04 00:00:00+00:00',
               '2021-12-14 00:00:00+00:00', '2021-12-24 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Note

Make sure to use `skip_until_exit` always in conjunction with disabled `until_next`.

Finally, to make the thing parametrizable, we should use the mode `FactoryMode.Exits` and provide any supporting information with the prefix `exit`:

```
>>> @njit
... def exit_place_func_nb(c, wait_td, index):  
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         if index[i] >= index[c.from_i] + wait_td:
...             return out_i
...     return -1

>>> ExitGenerator = vbt.SignalFactory(
...     mode="exits",
...     param_names=["wait_td"]
... ).with_place_func(
...     exit_place_func_nb=exit_place_func_nb,
...     exit_settings=dict(
...         pass_params=["wait_td"],
...     ),
...     var_args=True,
...     wait=0,  
...     until_next=False,
...     skip_until_exit=True,
...     param_settings=dict(  
...         wait_td=dict(
...             post_index_func=lambda x: x.map(lambda y: str(vbt.timedelta(y)))
...         )
...     ),
... )
>>> exit_generator = ExitGenerator.run(
...     entries,  
...     [
...         vbt.timedelta("3d").to_timedelta64(),  
...         vbt.timedelta("7d").to_timedelta64()
...     ],
...     symbol_wrapper.index.values
... )
>>> exit_generator.exits.sum()
custom_wait_td   symbol 
3 days 00:00:00  BTCUSDT    73
                 ETHUSDT    73
7 days 00:00:00  BTCUSDT    36
                 ETHUSDT    36
dtype: int64

```

We can then remove redundant entries if wanted:

```
>>> new_entries = exit_generator.entries.vbt.signals.first(  
...     reset_by=exit_generator.exits,  
...     allow_gaps=True,  
... )
>>> new_entries.index[new_entries[("7 days 00:00:00", "BTCUSDT")]]
DatetimeIndex(['2021-01-01 00:00:00+00:00', '2021-01-11 00:00:00+00:00',
               '2021-01-21 00:00:00+00:00', '2021-01-31 00:00:00+00:00',
               '2021-02-10 00:00:00+00:00', '2021-02-20 00:00:00+00:00',
               ...
               '2021-11-17 00:00:00+00:00', '2021-11-27 00:00:00+00:00',
               '2021-12-07 00:00:00+00:00', '2021-12-17 00:00:00+00:00',
               '2021-12-27 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

After that, each exit is guaranteed to come after the entry it was generated for.

### Both[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#both "Permanent link")

Instead of dividing the entry and exit signal generation parts, we can merge them. This is particularly well-suited for a scenario where an exit depends on an entry but also an entry depends on an exit. This kind of logic can be realized through the Numba-compiled function [generate\_enex\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.generate_enex_nb) and its accessor class method [SignalsAccessor.generate\_both](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_both). The generation proceeds as follows. First, two empty output masks are created: entries and exits. Then, for each column, the entry placement function is called to place one or more entry signals. The generator then searches for the position of the last generated entry signal, and calls the exit placement function on the segment right after that entry signal. Then, it's the entry placement function's turn again. This process repeats until the column has been traversed completely. The passed context is of the type [GenEnExContext](https://vectorbt.pro/pvt_40509f46/api/signals/enums/#vectorbtpro.signals.enums.GenEnExContext) and contains all the interesting information related to the current turn and iteration.

Let's demonstrate the full power of this method by placing an entry once the price dips below one threshold, and an exit once the price tops another threshold. The signals will be generated strictly one after another, and the entry/exit price will be the close price.

```
>>> @njit
... def entry_place_func_nb(c, low, close, th):
...     if c.from_i == 0:  
...         c.out[0] = True
...         return 0
...     exit_i = c.from_i - c.wait  
...     exit_price = close[exit_i, c.col]  
...     hit_price = exit_price * (1 - th)
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         if low[i, c.col] <= hit_price:  
...             return out_i
...     return -1

>>> @njit
... def exit_place_func_nb(c, high, close, th):  
...     entry_i = c.from_i - c.wait
...     entry_price = close[entry_i, c.col]
...     hit_price = entry_price * (1 + th)
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         if high[i, c.col] >= hit_price:
...             return out_i
...     return -1

>>> entries, exits = vbt.pd_acc.signals.generate_both(  
...     symbol_wrapper.shape,
...     entry_place_func_nb=entry_place_func_nb,
...     entry_place_args=(vbt.Rep("low"), vbt.Rep("close"), 0.1),  
...     exit_place_func_nb=exit_place_func_nb,
...     exit_place_args=(vbt.Rep("high"), vbt.Rep("close"), 0.2),
...     wrapper=symbol_wrapper,
...     broadcast_named_args=dict(  
...         high=data.get("High"),
...         low=data.get("Low"),
...         close=data.get("Close")
...     ),
...     broadcast_kwargs=dict(post_func=np.asarray)  
... )

>>> fig = data.plot(
...     symbol="BTCUSDT", 
...     ohlc_trace_kwargs=dict(opacity=0.5), 
...     plot_volume=False
... )
>>> entries["BTCUSDT"].vbt.signals.plot_as_entries(
...     y=data.get("Close", "BTCUSDT"), fig=fig)
>>> exits["BTCUSDT"].vbt.signals.plot_as_exits(
...     y=data.get("Close", "BTCUSDT"), fig=fig)
>>> fig.show()  

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/both.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/both.dark.svg#only-dark)

To parametrize this logic, we need to use the mode `FactoryMode.Both`. And because our functions require input arrays that broadcast against the input shape, vectorbt won't ask us to provide the input shape but rather determine it from the input arrays automatically:

```
>>> BothGenerator = vbt.SignalFactory(
...     mode="both",
...     input_names=["high", "low", "close"],
...     param_names=["entry_th", "exit_th"]
... ).with_place_func(
...     entry_place_func_nb=entry_place_func_nb,
...     entry_settings=dict(
...         pass_inputs=["low", "close"],
...         pass_params=["entry_th"],
...     ),
...     exit_place_func_nb=exit_place_func_nb,
...     exit_settings=dict(
...         pass_inputs=["high", "close"],
...         pass_params=["exit_th"],
...     )
... )
>>> both_generator = BothGenerator.run(
...     data.get("High"),
...     data.get("Low"),
...     data.get("Close"),
...     [0.1, 0.2],
...     [0.2, 0.3],
...     param_product=True
... )
>>> fig = data.plot(
...     symbol="BTCUSDT", 
...     ohlc_trace_kwargs=dict(opacity=0.5), 
...     plot_volume=False
... )
>>> both_generator.plot(
...     column=(0.1, 0.3, "BTCUSDT"), 
...     entry_y=data.get("Close", "BTCUSDT"), 
...     exit_y=data.get("Close", "BTCUSDT"), 
...     fig=fig
... )
>>> fig.show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/both2.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/both2.dark.svg#only-dark)

### Chained exits[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#chained-exits "Permanent link")

A chain in the vectorbt's vocabulary is a special ordering of entry and exit signals where each exit comes after exactly one entry and each entry (apart from the first one) comes after exactly one exit. Thus, we can easily identify which exit belongs to which entry and vice versa. The example above is actually a perfect example of a chain because each signal from crossing a threshold is based solely on the latest opposite signal. Now, imagine that we have already generated an array with entries, and each of those entries should exist only if there was an exit before, otherwise it should be ignored. This use case is very similar to `FactoryMode.Exits` with enabled `skip_until_exit` and disabled `until_next`.

But what the mode `FactoryMode.Chain` proposes is the following: use the generator [generate\_enex\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.generate_enex_nb) with the entry placement function [first\_place\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.first_place_nb) to select only the first entry signal after each exit, and any user-defined exit placement function. In the end, we will get two arrays: cleaned entries (often `new_entries`) and exits (`exits`).

What we should always keep in mind is that entries and exits during the generation phase aren't forced to be used as entries and exits respectively during the simulation. Let's generate entry signals from a moving average crossover each mimicing a limit order, and use an exit placement function to generate signals for executing those limit orders. As a result, we can use those newly generated signals as actual entries during the simulation! If any new "entry" signal comes before the previous "exit" signal, it will be ignored. We'll also track the fill price with another array.

```
>>> @njit
... def exit_place_func_nb(c, low, request_price, fill_price_out):
...     entry_req_price = request_price[c.from_i - c.wait, c.col]  
...     for out_i in range(len(c.out)):
...         i = c.from_i + out_i
...         if low[i, c.col] <= entry_req_price:  
...             fill_price_out[i, c.col] = entry_req_price
...             return out_i
...     return -1

>>> ChainGenerator = vbt.SignalFactory(
...     mode="chain",
...     input_names=["low", "request_price"],
...     in_output_names=["fill_price_out"]
... ).with_place_func(  
...     exit_place_func_nb=exit_place_func_nb,
...     exit_settings=dict(
...         pass_inputs=["low", "request_price"],
...         pass_in_outputs=["fill_price_out"],
...     ),
...     fill_price_out=np.nan  
... )

>>> fast_ma = vbt.talib("SMA").run(
...     data.get("Close"), 
...     vbt.Default(10), 
...     short_name="fast_ma"
... )
>>> slow_ma = vbt.talib("SMA").run(
...     data.get("Close"), 
...     vbt.Default(20), 
...     short_name="slow_ma"
... )
>>> entries = fast_ma.real_crossed_above(slow_ma)  
>>> entries.sum()
symbol
BTCUSDT    10
ETHUSDT     8
dtype: int64

>>> chain_generator = ChainGenerator.run(
...     entries,
...     data.get("Low"),
...     data.get("Close") * (1 - 0.1)  
... )
>>> request_mask = chain_generator.new_entries  
>>> request_mask.sum()
symbol
BTCUSDT    4
ETHUSDT    5
dtype: int64

>>> request_price = chain_generator.request_price  
>>> request_price[request_mask.any(axis=1)]
symbol                       BTCUSDT   ETHUSDT
Open time                                     
2021-02-04 00:00:00+00:00  33242.994  1436.103
2021-03-11 00:00:00+00:00  51995.844  1643.202
2021-04-02 00:00:00+00:00  53055.009  1920.321
2021-06-07 00:00:00+00:00  30197.511  2332.845
2021-06-15 00:00:00+00:00  36129.636  2289.186
2021-07-05 00:00:00+00:00  30321.126  1976.877
2021-07-06 00:00:00+00:00  30798.009  2090.250
2021-07-27 00:00:00+00:00  35512.083  2069.541

>>> fill_mask = chain_generator.exits  
>>> fill_mask.sum()
symbol
BTCUSDT    3
ETHUSDT    4
dtype: int64

>>> fill_price = chain_generator.fill_price_out  
>>> fill_price[fill_mask.any(axis=1)]
symbol                       BTCUSDT   ETHUSDT
Open time                                     
2021-03-24 00:00:00+00:00        NaN  1643.202
2021-05-19 00:00:00+00:00  33242.994  1920.321
2021-06-08 00:00:00+00:00        NaN  2332.845
2021-06-18 00:00:00+00:00  36129.636       NaN
2021-07-13 00:00:00+00:00        NaN  1976.877
2021-07-19 00:00:00+00:00  30798.009       NaN

```

For example, the first limit order for `BTCUSDT` was placed on `2021-02-04` and filled on `2021-05-19`. The first limit order for `ETHUSDT` was placed on `2021-03-11` and filled on `2021-03-24`. To simulate this data, we can pass `fill_mask` as entries/order size and `fill_mask` as order price.

Hint

If you want to replace any pending limit order with a new one instead of ignoring it, use `FactoryMode.Exits` and then select the last input signal before each output signal.

## Preset generators[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#preset-generators "Permanent link")

There is an entire range of preset signal generators - [here](https://vectorbt.pro/pvt_40509f46/api/signals/generators/) - that are using the modes we discussed above. Preset indicators were set up for one particular task and are ready to be used without having to provide any custom placement function. The naming of those indicators follows a well-defined schema:

-   Plain generator have no suffix
-   Exit generators have the suffix `X`
-   Both generators have the suffix `NX`
-   Chain exit generators have the suffix `CX`

### Random[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#random "Permanent link")

You hate randomness in trading? Well, there is one particular use case where randomness is heartily welcomed: trading strategy benchmarking. For instance, comparing one configuration of RSI to another one isn't representative at all since both strategy instances may be inherently bad, and deciding for one is like picking a lesser evil. Random signals, on the other hand, give us an entire new universe of strategies yet to be discovered. Generating a sufficient number of such random signal permutations on a market can reveal the underlying structure and behavior of the market and may answer whether our trading strategy is driven by an edge or pure randomness.

There are two types of random signal generation: count-based and probability-based. The former takes a target number of signals `n` to place during a certain period of time, and guarantees to fulfill this number unless the time period is too small. The latter takes a probability `prob` of placing a signal at each timestamp; if the probability is too high, it may place a signal at each single timestamp; if the probability is too low, it may place nothing. Both types can be run using the same accessor method: [SignalsAccessor.generate\_random](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_random) to spread entry signals across the entire column, [SignalsAccessor.generate\_random\_exits](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_random_exits) to spread exit signals after each entry and before the next entry, and [SignalsAccessor.generate\_random\_both](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_random_both) to spread entry and exit signals one after another in a chain.

Warning

Generating a specific number of signals may introduce the look-ahead bias because it incorporates the knowledge about the next opposite signal or the column end. Use it with caution, and only when the position of the last to-be-placed signal is known in advance, such as when trading on the per-month basis.

Let's generate a signal once in 10 timestamps on average:

```
>>> btcusdt_wrapper = symbol_wrapper["BTCUSDT"]
>>> mask = vbt.pd_acc.signals.generate_random(
...     btcusdt_wrapper.shape,
...     prob=1 / 10,
...     wrapper=btcusdt_wrapper,
...     seed=42  
... )
>>> mask_index = mask.index[mask]
>>> (mask_index[1:] - mask_index[:-1]).mean()  
Timedelta('8 days 03:20:55.813953488')

```

Note

The more signals we generate, the closer is the average neighbor distance to the target average.

Now, let's generate exactly one signal each week. To achieve that, we'll generate an "entry" signal on each Monday, and an "exit" signal acting as our target signal. This won't cause the look-ahead bias because we have defined the bounds of the generation space in advance.

```
>>> monday_mask = btcusdt_wrapper.fill(False)
>>> monday_mask.vbt.set(True, every="monday", inplace=True)  
>>> mask = monday_mask.vbt.signals.generate_random_exits(wait=0)  
>>> mask_index = mask.index[mask]
>>> mask_index.strftime("%W %A")  
Index(['01 Tuesday', '02 Wednesday', '03 Wednesday', '04 Friday', '05 Friday',
       '06 Tuesday', '07 Thursday', '08 Tuesday', '09 Friday', '10 Saturday',
       '11 Friday', '12 Saturday', '13 Monday', '14 Friday', '15 Monday',
       ...
       '41 Wednesday', '42 Friday', '43 Thursday', '44 Sunday', '45 Sunday',
       '46 Sunday', '47 Saturday', '48 Saturday', '49 Tuesday', '50 Thursday',
       '51 Sunday', '52 Tuesday'],
      dtype='object', name='Open time')

```

To parametrize the number of signals and the probability, we have at our disposal the indicators starting with the prefix `RAND` and `RPROB` respectively. A powerful feature of those indicators is their ability to take both parameters as array-like objects! In particular, we can provide `n` per column, and `prob` per column, row, or even element in the target shape.

Let's gradually generate more signals with time using [RPROB](https://vectorbt.pro/pvt_40509f46/api/signals/generators/rprob/#vectorbtpro.signals.generators.rprob.RPROB)! We'll start with the probability of 0% and end with the probability of 100% of placing a signal at each timestamp:

```
>>> prob = np.linspace(0, 1, len(symbol_wrapper.index))  
>>> rprob = vbt.RPROB.run(
...     symbol_wrapper.shape,  
...     vbt.Default(vbt.to_2d_pr_array(prob)),  
...     seed=42,
...     input_index=symbol_wrapper.index,
...     input_columns=symbol_wrapper.columns
... )
>>> rprob.entries.astype(int).vbt.ts_heatmap().show()  

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/rprob.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/rprob.dark.svg#only-dark)

To test multiple values, we can provide them as a list. Let's prove that the fixed probability of 50% yields the same number of signals on average as the one ranging from 0% to 100% (but both are still totally different distributions!):

```
>>> rprob = vbt.RPROB.run(
...     symbol_wrapper.shape,
...     [0.5, vbt.to_2d_pr_array(prob)],
...     seed=42,
...     input_index=symbol_wrapper.index,
...     input_columns=symbol_wrapper.columns
... )
>>> rprob.entries.sum()
rprob_prob  symbol 
0.5         BTCUSDT    176
            ETHUSDT    187
array_0     BTCUSDT    183
            ETHUSDT    178
dtype: int64

```

### Stops[¶](https://vectorbt.pro/pvt_40509f46/tutorials/signal-development/generation/#stops "Permanent link")

Stop signals are an essential part of signal development because they allow us to propagate a stop condition throughout time. There are two main stop signal generators offered by vectorbt: a basic one that compares a single time series against any stop condition, and a specialized one that compares candlestick data against stop order conditions common in trading.

The first type can be run using the Numba-compiled function [stop\_place\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.stop_place_nb) and its accessor instance method [SignalsAccessor.generate\_stop\_exits](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_stop_exits). Additionally, there are indicator classes [STX](https://vectorbt.pro/pvt_40509f46/api/signals/generators/stx/#vectorbtpro.signals.generators.stx.STX) and [STCX](https://vectorbt.pro/pvt_40509f46/api/signals/generators/stcx/#vectorbtpro.signals.generators.stcx.STCX) that make the stop parametrizable. Let's use the accessor method to generate take profit (TP) signals. For this, we need four inputs: entry signals (`entries`), the entry price to apply the stop on (`entry_ts`), the high price (`ts`), and the actual stop(s) in % to compare the high price against (`stop`). We'll use the crossover entries generated previously. We'll also run the method in the chained exits mode to force vectorbt to wait for an exit and remove any entry signals that appear before.

```
>>> new_entries, exits = entries.vbt.signals.generate_stop_exits(
...     data.get("Close"),
...     data.get("High"),
...     stop=0.1,
...     chain=True
... )
>>> new_entries[new_entries.any(axis=1)]
symbol                     BTCUSDT  ETHUSDT
Open time                                  
2021-02-04 00:00:00+00:00     True    False
2021-03-10 00:00:00+00:00     True    False
...
2021-11-07 00:00:00+00:00     True    False
2021-12-02 00:00:00+00:00    False     True

>>> exits[exits.any(axis=1)]
symbol                     BTCUSDT  ETHUSDT
Open time                                  
2021-02-06 00:00:00+00:00     True    False
2021-03-13 00:00:00+00:00     True    False
...
2021-10-15 00:00:00+00:00    False     True
2021-10-19 00:00:00+00:00     True    False

```

But how do we determine the stop price? Gladly, the Numba-compiled function also accepts a (required) in-output array `stop_ts` that is being written with the stop price of each exit. By default, vectorbt assumes that we're not interested in this array, and to avoid consuming much memory, it creates an empty (uninitialized) array, passes it to Numba, and deletes it afterwards. To make it return the array, we need to pass an empty dictionary `out_dict` where the accessor method can put the array. Whenever the `out_dict` is detected, vectorbt will create a full (initialized) array with `np.nan`, pass it to Numba, and put it back into the dictionary:

```
>>> out_dict = {}
>>> new_entries, exits = entries.vbt.signals.generate_stop_exits(
...     data.get("Close"),
...     data.get("High"),
...     stop=0.1,
...     chain=True,
...     out_dict=out_dict
... )
>>> out_dict["stop_ts"][exits.any(axis=1)]
symbol                       BTCUSDT   ETHUSDT
Open time                                     
2021-02-06 00:00:00+00:00  40630.326       NaN
2021-03-13 00:00:00+00:00  61436.749       NaN
...
2021-10-15 00:00:00+00:00        NaN  3866.797
2021-10-19 00:00:00+00:00  63179.721       NaN

```

Hint

We could have also passed our own (already created) `stop_ts` inside `out_dict` and vectorbt would override only those elements that correspond to exits!

The same can be done with the corresponding indicator class. But let's do something completely different: test two trailing stop loss (TSL) parameters instead, where the condition is following the high price upwards and is met once the low price crosses the stop value downwards. The high price can be specified with the argument `follow_ts`. The entry price will be the open price (even though we generated them using the close price, let's assume this scenario for a second), and thus we'll also allow placing the first signal at the entry bar by making `wait` zero:

```
>>> stcx = vbt.STCX.run(  
...     entries,
...     data.get("Open"),
...     ts=data.get("Low"),
...     follow_ts=data.get("High"),
...     stop=-0.1,  
...     trailing=[False, True],  
...     wait=0  
... )
>>> fig = data.plot(
...     symbol="BTCUSDT", 
...     ohlc_trace_kwargs=dict(opacity=0.5), 
...     plot_volume=False
... )
>>> stcx.plot(
...     column=(-0.1, True, "BTCUSDT"), 
...     entry_y="entry_ts",  
...     exit_y="stop_ts", 
...     fig=fig
... )
>>> fig.show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/stcx.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/stcx.dark.svg#only-dark)

Note

Waiting time cannot be higher than 1. If waiting time is 0, `entry_ts` should be the first value in the bar. If waiting time is 1, `entry_ts` should be the last value in the bar, otherwise the stop could have also been hit at the first bar.

Also, by making the waiting time zero, you may get an entry and an exit at the same bar. Multiple orders at the same bar can only be implemented using a flexible order function or by converting the signals directly into order records. When passed directly to [Portfolio.from\_signals](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_signals), any conflicting signals will be ignored.

If we're looking into placing solely SL, TSL, TP, and TTP orders, a more complete approach would be using the full OHLC information, which is utilized by the Numba-compiled function [ohlc\_stop\_place\_nb](https://vectorbt.pro/pvt_40509f46/api/signals/nb/#vectorbtpro.signals.nb.ohlc_stop_place_nb), the accessor instance method [SignalsAccessor.generate\_ohlc\_stop\_exits](https://vectorbt.pro/pvt_40509f46/api/signals/accessors/#vectorbtpro.signals.accessors.SignalsAccessor.generate_ohlc_stop_exits), and the corresponding indicator classes [OHLCSTX](https://vectorbt.pro/pvt_40509f46/api/signals/generators/ohlcstx/#vectorbtpro.signals.generators.ohlcstx.OHLCSTX) and [OHLCSTCX](https://vectorbt.pro/pvt_40509f46/api/signals/generators/ohlcstcx/#vectorbtpro.signals.generators.ohlcstcx.OHLCSTCX). The key advantage of this approach is the ability to check for all stop order conditions simultaneously!

Let's generate signals based on a [stop loss and trailing stop loss combo](https://www.investopedia.com/articles/trading/08/trailing-stop-loss.asp) of 10% and 15% respectively:

```
>>> ohlcstcx = vbt.OHLCSTCX.run(
...     entries,
...     data.get("Close"),  
...     data.get("Open"),  
...     data.get("High"),
...     data.get("Low"),
...     data.get("Close"),
...     sl_stop=vbt.Default(0.1),  
...     tsl_stop=vbt.Default(0.15),
...     is_entry_open=False  
... )
>>> ohlcstcx.plot(column=("BTCUSDT")).show()  

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx.dark.svg#only-dark)

Keep in mind that we don't have intra-candle data. If there was a huge price fluctuation in both directions, we wouldn't be able to determine whether SL was triggered before TP and vice versa. So some assumptions need to be made:

-   If a stop has been hit before the open price, the stop price becomes the current open price. This especially holds for `wait=1` and `is_entry_open=True`.
-   Trailing stop can only be based on the previous high/low price, not the current one
-   We pessimistically assume that any SL is triggered before any TP

A common tricky situation is when the entry price is the open price and we're waiting one bar. For instance, what would happen if the condition was met during the waiting time? We cannot place an exit signal at the entry bar. Instead, the function waits until the next bar and checks whether the condition is still valid for the open price. If yes, the signal is placed with the stop price being the open price. If not, the function simply waits until the next opportunity arrives. If the stop is trailing, the target price will update just as usual at the entry timestamp. To avoid any logical bugs, it's advised to use the close price as the entry price when `wait` is one bar (default).

When working with multiple stop types at the same time, we often want to know which exact type was triggered. This information is stored in the array `stop_type` (machine-readable) and `stop_type_readable` (human-readable):

```
>>> ohlcstcx.stop_type_readable[ohlcstcx.exits.any(axis=1)]
symbol                    BTCUSDT ETHUSDT
Open time                                
2021-02-22 00:00:00+00:00     TSL    None
2021-03-23 00:00:00+00:00    None     TSL
2021-03-24 00:00:00+00:00     TSL    None
2021-04-18 00:00:00+00:00      SL     TSL
2021-05-12 00:00:00+00:00      SL    None
2021-06-08 00:00:00+00:00    None      SL
2021-06-18 00:00:00+00:00      SL    None
2021-07-09 00:00:00+00:00    None     TSL
2021-07-19 00:00:00+00:00      SL    None
2021-09-07 00:00:00+00:00     TSL     TSL
2021-11-16 00:00:00+00:00     TSL     TSL
2021-12-03 00:00:00+00:00    None      SL
2021-12-29 00:00:00+00:00    None      SL
2021-12-31 00:00:00+00:00      SL    None

```

All the stop types are listed in the enumerated type [StopType](https://vectorbt.pro/pvt_40509f46/api/signals/enums/#vectorbtpro.signals.enums.StopType).

Both stop signal generation modes are very flexible towards inputs. For example, if any element in the arrays `ts` and `follow_ts` in the first mode is NaN (default), it will be substituted by the element in `entry_ts`. If only an element in `follow_ts` is NaN, it will be substituted by the minimum or maximum (depending on the sign of the stop value) of the element in both other arrays. Similarly, in the second mode, we can provide only `entry_price` and vectorbt will auto-populate the open price if `is_entry_open` is enabled and the close price otherwise. Without `high`, vectorbt will take the maximum out of `open` and `close`. Generally, we're not forced to provide every bit of information apart from the entry price, but it's in our best interest to provide as much information as we can to make best decisions and to closely mimic the real world.

For example, let's run the same as above but specify the entry price only:

```
>>> ohlcstcx = vbt.OHLCSTCX.run(
...     entries,
...     data.get("Close"),
...     sl_stop=vbt.Default(0.1),
...     tsl_stop=vbt.Default(0.15),
...     is_entry_open=False
... )
>>> ohlcstcx.plot(column=("BTCUSDT")).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx2.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx2.dark.svg#only-dark)

The same flexibility goes for parameters: similarly to the behavior of the probability parameter in random signal generators, we can pass each parameter as an array, such as one element per row, column, or even element. Let's treat each second entry as a short entry and thus reverse the [trailing take profit](https://capitalise.ai/trailing-take-profit-manage-your-risk-while-locking-the-profits/) (TTP) logic for it:

```
>>> entry_pos_rank = entries.vbt.signals.pos_rank(allow_gaps=True)  
>>> short_entries = (entry_pos_rank >= 0) & (entry_pos_rank % 2 == 1)  

>>> ohlcstcx = vbt.OHLCSTCX.run(
...     entries,
...     data.get("Close"),
...     data.get("Open"),
...     data.get("High"),
...     data.get("Low"),
...     data.get("Close"),
...     tsl_th=vbt.Default(0.2),  
...     tsl_stop=vbt.Default(0.1),
...     reverse=vbt.Default(short_entries),  
...     is_entry_open=False
... )
>>> ohlcstcx.plot(column=("BTCUSDT")).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx3.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx3.dark.svg#only-dark)

We can then split both final arrays into four direction-aware arrays for simulation:

```
>>> long_entries = ohlcstcx.new_entries.vbt & (~short_entries)  
>>> long_exits = ohlcstcx.exits.vbt.signals.first_after(long_entries)  
>>> short_entries = ohlcstcx.new_entries.vbt & short_entries
>>> short_exits = ohlcstcx.exits.vbt.signals.first_after(short_entries)

>>> fig = data.plot(
...     symbol="BTCUSDT", 
...     ohlc_trace_kwargs=dict(opacity=0.5), 
...     plot_volume=False
... )
>>> long_entries["BTCUSDT"].vbt.signals.plot_as_entries(
...     ohlcstcx.entry_price["BTCUSDT"],
...     trace_kwargs=dict(marker=dict(color="limegreen"), name="Long entries"), 
...     fig=fig
... )
>>> long_exits["BTCUSDT"].vbt.signals.plot_as_exits(
...     ohlcstcx.stop_price["BTCUSDT"],
...     trace_kwargs=dict(marker=dict(color="orange"), name="Long exits"),
...     fig=fig
... )
>>> short_entries["BTCUSDT"].vbt.signals.plot_as_entries(
...     ohlcstcx.entry_price["BTCUSDT"],
...     trace_kwargs=dict(marker=dict(color="magenta"), name="Short entries"),
...     fig=fig
... )
>>> short_exits["BTCUSDT"].vbt.signals.plot_as_exits(
...     ohlcstcx.stop_price["BTCUSDT"],
...     trace_kwargs=dict(marker=dict(color="red"), name="Short exits"),
...     fig=fig
... )
>>> fig.show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx4.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/signal-dev/ohlcstcx4.dark.svg#only-dark)

Seems like all trades are winning, thanks to a range-bound but still volatile market ![🍀](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f340.svg ":four_leaf_clover:")

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/tutorials/signal-development/generation.py.txt) [Notebook](https://github.com/polakowo/vectorbt.pro/blob/main/notebooks/SignalDevelopment.ipynb)