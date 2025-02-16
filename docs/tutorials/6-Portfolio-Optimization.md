Portfolio optimization is all about creating a portfolio of assets such that our investment has the maximum return and minimum risk. A portfolio in this regard is the asset distribution of an investor - a weight vector, which can be well optimized for risk appetite, expected rate of return, cost minimization, and other target metrics. Moreover, such optimization can be performed on a regular basis to account for any recent changes in the market behavior.

In vectorbt, a portfolio consists of a set of asset vectors stacked into a bigger array along the column axis. By default, each of those vectors is considered as a separate backtesting instance, but we can provide a grouping instruction to treat any number of assets as a whole. Portfolio optimization is then the process of translating a set of pricing vectors (information as input) into a set of allocation vectors (actions as output), which can be fed to any simulator.

Thanks to a modular nature of vectorbt (_and to respect the holy principles of data science_), the optimization and simulation parts are being kept separately to make possible analyzing and filtering out allocation vectors even before they are actually backtested. In fact, this is quite similar to the workflow we usually apply when working with signals - 1) generate, 2) pre-analyze, 3) simulate, and 4) post-analyze. In this example, we'll discuss how to perform each of those steps for highest information yield.

## Data[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#data "Permanent link")

As always, we should start with getting some data. Since portfolio optimization involves working on a pool of assets, we need to fetch more than one symbol of data. In particular, we'll fetch one year of hourly data of 5 different cryptocurrencies:

```
>>> from vectorbtpro import *

>>> data = vbt.BinanceData.pull(
...     ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT"], 
...     start="2020-01-01 UTC", 
...     end="2021-01-01 UTC",
...     timeframe="1h"
... )

```

Let's persist the data locally to avoid re-fetching it every time we start a new runtime:

```
>>> data.to_hdf()

>>> data = vbt.HDFData.pull("BinanceData.h5")

```

## Allocation[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#allocation "Permanent link")

Simply put, asset allocation is the process of deciding where to put money to work in the market - it's a horizontal vector that is consisting of weights or amount of assets and, that is located at a certain timestamp. For example, to allocate 50% to `BTCUSDT`, 20% to `ETHUSDT` and the remaining amount to other assets, the allocation vector would look like this: `[0.5, 0.2, 0.1, 0.1, 0.1]`. Very often, weight allocations sum to 1 to constantly keep the entire stake in the market, but we can also move only a part of our balance, or allocate the (continuous or discrete) number of assets as opposed to weights. Since we usually want to allocate periodically rather than invest and wait until the end of times, we also need to decide on rebalancing timestamps.

### Manually[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#manually "Permanent link")

Let's generate and simulate allocations manually to gain a better understanding of how everything fits together.

#### Index points[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#index-points "Permanent link")

First thing to do is to decide at which points in time we should re-allocate. This is fairly easy using [ArrayWrapper.get\_index\_points](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.get_index_points), which translates a human-readable query into a list of index positions (also called "index points" or "allocation points"). Those positions are just regular indices, where `0` denotes the first row and `len(index) - 1` denotes the last one.

For example, let's translate the first day of each month into index points:

```
>>> ms_points = data.wrapper.get_index_points(every="M")
>>> ms_points
array([0, 744, 1434, 2177, 2895, 3639, 4356, 5100, 5844, 6564, 7308, 8027])

```

Hint

The indices above can be validated using Pandas:

```
>>> data.wrapper.index.get_indexer(
...     pd.Series(index=data.wrapper.index).resample(vbt.offset("M")).asfreq().index, 
...     method="bfill"
... )
array([0, 744, 1434, 2177, 2895, 3639, 4356, 5100, 5844, 6564, 7308, 8027])

```

We can then translate those index points back into timestamps:

```
>>> data.wrapper.index[ms_points]
DatetimeIndex(['2020-01-01 00:00:00+00:00', '2020-02-01 00:00:00+00:00',
               '2020-03-01 00:00:00+00:00', '2020-04-01 00:00:00+00:00',
               '2020-05-01 00:00:00+00:00', '2020-06-01 00:00:00+00:00',
               '2020-07-01 00:00:00+00:00', '2020-08-01 00:00:00+00:00',
               '2020-09-01 00:00:00+00:00', '2020-10-01 00:00:00+00:00',
               '2020-11-01 00:00:00+00:00', '2020-12-01 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Note

[ArrayWrapper.get\_index\_points](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.get_index_points) is guaranteed to return indices that can be applied on the index, unless `skipna` is disabled, which will return `-1` whenever an index point cannot be matched.

Those are our [rebalancing](https://www.investopedia.com/terms/r/rebalancing.asp) timestamps!

The main power of this method is in its flexibility: `every` can be provided as a string, an integer, `pd.Timedelta` object, or `pd.DateOffset` object:

```
>>> example_points = data.wrapper.get_index_points(every=24 * 30)  
>>> data.wrapper.index[example_points]
DatetimeIndex(['2020-01-01 00:00:00+00:00', '2020-01-31 00:00:00+00:00',
               '2020-03-01 06:00:00+00:00', '2020-03-31 07:00:00+00:00',
               '2020-04-30 09:00:00+00:00', '2020-05-30 09:00:00+00:00',
               '2020-06-29 12:00:00+00:00', '2020-07-29 12:00:00+00:00',
               '2020-08-28 12:00:00+00:00', '2020-09-27 12:00:00+00:00',
               '2020-10-27 12:00:00+00:00', '2020-11-26 12:00:00+00:00',
               '2020-12-26 17:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

>>> date_offset = pd.offsets.WeekOfMonth(week=3, weekday=4)
>>> example_points = data.wrapper.get_index_points(  
...     every=date_offset, 
...     add_delta=pd.Timedelta(hours=17)
... )
>>> data.wrapper.index[example_points]
DatetimeIndex(['2020-01-24 17:00:00+00:00', '2020-02-28 17:00:00+00:00',
               '2020-03-27 17:00:00+00:00', '2020-04-24 17:00:00+00:00',
               '2020-05-22 17:00:00+00:00', '2020-06-26 17:00:00+00:00',
               '2020-07-24 17:00:00+00:00', '2020-08-28 17:00:00+00:00',
               '2020-09-25 17:00:00+00:00', '2020-10-23 17:00:00+00:00',
               '2020-11-27 17:00:00+00:00', '2020-12-25 17:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

We can also provide `start` and `end` as human-readable strings (thanks to [dateparser](https://github.com/scrapinghub/dateparser)!), integers, or `pd.Timestamp` objects, to effectively limit the entire date range:

```
>>> example_points = data.wrapper.get_index_points(
...     start="April 1st 2020",
...     every="M"
... )
>>> data.wrapper.index[example_points]
DatetimeIndex(['2020-04-01 00:00:00+00:00', '2020-05-01 00:00:00+00:00',
               '2020-06-01 00:00:00+00:00', '2020-07-01 00:00:00+00:00',
               '2020-08-01 00:00:00+00:00', '2020-09-01 00:00:00+00:00',
               '2020-10-01 00:00:00+00:00', '2020-11-01 00:00:00+00:00',
               '2020-12-01 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

Another great feature is being able to provide our own dates via `on` argument and [ArrayWrapper.get\_index\_points](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.get_index_points) will match them with our index. If any date cannot be found, it simply uses the next date (not the previous one - we don't want to look into the future, after all):

```
>>> example_points = data.wrapper.get_index_points(
...     on=["April 1st 2020 19:45", "17 September 2020 00:01"]
... )
>>> data.wrapper.index[example_points]
DatetimeIndex([
    '2020-04-01 20:00:00+00:00', 
    '2020-09-17 01:00:00+00:00'
], dtype='datetime64[ns, UTC]', name='Open time', freq=None)

```

But let's continue with `ms_points` generated earlier.

#### Filling[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#filling "Permanent link")

We've got our allocation index points, now it's time to fill actual allocations at those points. First, we need to create an empty DataFrame with symbols aligned as columns:

```
>>> symbol_wrapper = data.get_symbol_wrapper(freq="1h")  
>>> filled_allocations = symbol_wrapper.fill()  
>>> filled_allocations
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00      NaN      NaN      NaN      NaN      NaN
2020-01-01 01:00:00+00:00      NaN      NaN      NaN      NaN      NaN
2020-01-01 02:00:00+00:00      NaN      NaN      NaN      NaN      NaN
...                            ...      ...      ...      ...      ...
2020-12-31 21:00:00+00:00      NaN      NaN      NaN      NaN      NaN
2020-12-31 22:00:00+00:00      NaN      NaN      NaN      NaN      NaN
2020-12-31 23:00:00+00:00      NaN      NaN      NaN      NaN      NaN

[8767 rows x 5 columns]

```

Then, we need to generate allocations and place them at their index points. In our example, we will create allocations randomly:

```
>>> np.random.seed(42)  

>>> def random_allocate_func():
...     weights = np.random.uniform(size=symbol_wrapper.shape[1])
...     return weights / weights.sum()  

>>> for idx in ms_points:
...     filled_allocations.iloc[idx] = random_allocate_func()

>>> allocations = filled_allocations[~filled_allocations.isnull().any(axis=1)]
>>> allocations
symbol                      ADAUSDT   BNBUSDT   BTCUSDT   ETHUSDT   XRPUSDT
Open time                                                                  
2020-01-01 00:00:00+00:00  0.133197  0.338101  0.260318  0.212900  0.055485
2020-02-01 00:00:00+00:00  0.065285  0.024308  0.362501  0.251571  0.296334
2020-03-01 00:00:00+00:00  0.009284  0.437468  0.375464  0.095773  0.082010
2020-04-01 00:00:00+00:00  0.105673  0.175297  0.302353  0.248877  0.167800
2020-05-01 00:00:00+00:00  0.327909  0.074759  0.156568  0.196343  0.244421
2020-06-01 00:00:00+00:00  0.367257  0.093395  0.240527  0.277095  0.021727
2020-07-01 00:00:00+00:00  0.220313  0.061837  0.023590  0.344094  0.350166
2020-08-01 00:00:00+00:00  0.346199  0.130452  0.041828  0.293025  0.188497
2020-09-01 00:00:00+00:00  0.067065  0.272119  0.018898  0.499708  0.142210
2020-10-01 00:00:00+00:00  0.297647  0.140040  0.233647  0.245617  0.083048
2020-11-01 00:00:00+00:00  0.232128  0.185574  0.224925  0.214230  0.143143
2020-12-01 00:00:00+00:00  0.584609  0.056118  0.124283  0.028681  0.206309

```

That's it - we can now use those weight vectors in simulation!

#### Simulation[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#simulation "Permanent link")

The simulation step is rather easy: use filled allocations as size of target percentage type, and enable a grouping with cash sharing and the dynamic call sequence.

```
>>> pf = vbt.Portfolio.from_orders(
...     close=data.get("Close"),
...     size=filled_allocations,
...     size_type="targetpercent",
...     group_by=True,  
...     cash_sharing=True,
...     call_seq="auto"  
... )

```

We can then extract the actual allocations produced by the simulation:

```
>>> sim_alloc = pf.get_asset_value(group_by=False).vbt / pf.value
>>> sim_alloc  
symbol                      ADAUSDT   BNBUSDT   BTCUSDT   ETHUSDT   XRPUSDT
Open time                                                                  
2020-01-01 00:00:00+00:00  0.133197  0.338101  0.260318  0.212900  0.055485
2020-01-01 01:00:00+00:00  0.132979  0.337881  0.259649  0.214099  0.055393
2020-01-01 02:00:00+00:00  0.133259  0.337934  0.259737  0.213728  0.055342
...                             ...       ...       ...       ...       ...
2020-12-31 21:00:00+00:00  0.636496  0.067686  0.188081  0.035737  0.072000
2020-12-31 22:00:00+00:00  0.634586  0.068128  0.189404  0.035930  0.071952
2020-12-31 23:00:00+00:00  0.638154  0.068205  0.187649  0.035619  0.070373

[8766 rows x 5 columns]

```

We can plot the allocations either manually:

```
>>> sim_alloc.vbt.plot(
...    trace_kwargs=dict(stackgroup="one"),
...    use_gl=False
... ).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/actual_allocations.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/actual_allocations.dark.svg#only-dark)

Or by using [Portfolio.plot\_allocations](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.plot_allocations):

```
>>> pf.plot_allocations().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/plot_allocations.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/plot_allocations.dark.svg#only-dark)

Without transaction costs such as commission and slippage, the source and target allocations should closely match at the allocation points:

```
>>> np.isclose(allocations, sim_alloc.iloc[ms_points])
array([[ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True],
       [ True,  True,  True,  True,  True]])

```

### Allocation method[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#allocation-method "Permanent link")

We've learned how to manually generate, fill, and simulate allocations. But vectorbt wouldn't be vectorbt if it hadn't a convenient function for this! And here comes [PortfolioOptimizer](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer) into play: it exposes a range of class methods to generate allocations. The workings of this class are rather simple (in contrast to its implementation): generate allocations and store them in a compressed form for further use in analysis and simulation.

The generation part is done by the class method [PortfolioOptimizer.from\_allocate\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_allocate_func). If you look the documentation of this method, you'll notice that it takes the same arguments as [ArrayWrapper.get\_index\_points](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.get_index_points) to generate index points. Then, at each of those points, it calls a user-defined allocation function `allocate_func` to get an allocation vector. Finally, all the returned vectors are concatenated into a single two-dimensional NumPy array, while index points are stored in a separate structured NumPy array of type [AllocPoints](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/records/#vectorbtpro.portfolio.pfopt.records.AllocPoints).

Let's apply the optimizer class on `random_allocate_func`:

```
>>> np.random.seed(42)

>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,  
...     random_allocate_func,
...     every="M"  
... )

```

Let's take a look at the generated random allocations:

```
>>> pfo.allocations  
symbol                      ADAUSDT   BNBUSDT   BTCUSDT   ETHUSDT   XRPUSDT
Open time                                                                  
2020-01-01 00:00:00+00:00  0.133197  0.338101  0.260318  0.212900  0.055485
2020-02-01 00:00:00+00:00  0.065285  0.024308  0.362501  0.251571  0.296334
2020-03-01 00:00:00+00:00  0.009284  0.437468  0.375464  0.095773  0.082010
2020-04-01 00:00:00+00:00  0.105673  0.175297  0.302353  0.248877  0.167800
2020-05-01 00:00:00+00:00  0.327909  0.074759  0.156568  0.196343  0.244421
2020-06-01 00:00:00+00:00  0.367257  0.093395  0.240527  0.277095  0.021727
2020-07-01 00:00:00+00:00  0.220313  0.061837  0.023590  0.344094  0.350166
2020-08-01 00:00:00+00:00  0.346199  0.130452  0.041828  0.293025  0.188497
2020-09-01 00:00:00+00:00  0.067065  0.272119  0.018898  0.499708  0.142210
2020-10-01 00:00:00+00:00  0.297647  0.140040  0.233647  0.245617  0.083048
2020-11-01 00:00:00+00:00  0.232128  0.185574  0.224925  0.214230  0.143143
2020-12-01 00:00:00+00:00  0.584609  0.056118  0.124283  0.028681  0.206309

```

We can also fill the entire array to be used in simulation:

```
>>> pfo.filled_allocations  
symbol                      ADAUSDT   BNBUSDT   BTCUSDT  ETHUSDT   XRPUSDT
Open time                                                                 
2020-01-01 00:00:00+00:00  0.133197  0.338101  0.260318   0.2129  0.055485
2020-01-01 01:00:00+00:00       NaN       NaN       NaN      NaN       NaN
2020-01-01 02:00:00+00:00       NaN       NaN       NaN      NaN       NaN
2020-01-01 03:00:00+00:00       NaN       NaN       NaN      NaN       NaN
...                             ...       ...       ...      ...       ...
2020-12-31 21:00:00+00:00       NaN       NaN       NaN      NaN       NaN
2020-12-31 22:00:00+00:00       NaN       NaN       NaN      NaN       NaN
2020-12-31 23:00:00+00:00       NaN       NaN       NaN      NaN       NaN

[8767 rows x 5 columns]

```

Note

A row full of NaN points means no allocation takes place at that timestamp.

Since an instance of [PortfolioOptimizer](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer) not only stores the allocation vectors but also index points themselves, we can access them under [PortfolioOptimizer.alloc\_records](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.alloc_records) and analyze as regular records:

```
>>> pfo.alloc_records.records_readable
    Id  Group          Allocation Index
0    0  group 2020-01-01 00:00:00+00:00
1    1  group 2020-02-01 00:00:00+00:00
2    2  group 2020-03-01 00:00:00+00:00
3    3  group 2020-04-01 00:00:00+00:00
4    4  group 2020-05-01 00:00:00+00:00
5    5  group 2020-06-01 00:00:00+00:00
6    6  group 2020-07-01 00:00:00+00:00
7    7  group 2020-08-01 00:00:00+00:00
8    8  group 2020-09-01 00:00:00+00:00
9    9  group 2020-10-01 00:00:00+00:00
10  10  group 2020-11-01 00:00:00+00:00
11  11  group 2020-12-01 00:00:00+00:00

```

The allocations can be plotted very easily using [PortfolioOptimizer.plot](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.plot):

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/optimizer.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/optimizer.dark.svg#only-dark)

Since [PortfolioOptimizer](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer) is a subclass of [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable), we can produce some stats describing the current optimizer state:

```
>>> pfo.stats()
Start                       2020-01-01 00:00:00+00:00
End                         2020-12-31 23:00:00+00:00
Period                              365 days 06:00:00
Total Records                                      12
Mean Allocation: ADAUSDT                     0.229714
Mean Allocation: BNBUSDT                     0.165789
Mean Allocation: BTCUSDT                     0.197075
Mean Allocation: ETHUSDT                     0.242326
Mean Allocation: XRPUSDT                     0.165096
Name: group, dtype: object

```

What about simulation? [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) has a special class method for this: [Portfolio.from\_optimizer](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_optimizer).

```
>>> pf = vbt.Portfolio.from_optimizer(data, pfo, freq="1h")

>>> pf.sharpe_ratio
2.097991099869708

```

Or, directly from the portfolio optimizer:

```
>>> pf = pfo.simulate(data, freq="1h")

>>> pf.sharpe_ratio
2.097991099869708

```

As we see, vectorbt yet again deploys a modular approach to make individual backtesting components as coherent as possible and as less cohesive as possible: instead of defining the entire logic inside a single backtesting module, we can split the pipeline into a set of logically separated, isolated components, each of which can be well maintained on its own.

#### Once[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#once "Permanent link")

To allocate once, we can either use [PortfolioOptimizer.from\_allocate\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_allocate_func) with `on=0`, or just use [PortfolioOptimizer.from\_initial](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_initial):

```
>>> def const_allocate_func(target_alloc):
...     return target_alloc

>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     const_allocate_func,
...     [0.5, 0.2, 0.1, 0.1, 0.1],
...     on=0
... )

>>> pfo.plot().show()

```

```
>>> pfo = vbt.PortfolioOptimizer.from_initial(
...     symbol_wrapper,
...     [0.5, 0.2, 0.1, 0.1, 0.1]
... )

>>> pfo.plot().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/once.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/once.dark.svg#only-dark)

Note

Even if the lines look straight on the chart, it doesn't mean that rebalancing takes place at each timestamp - it's mainly because vectorbt forward-fills the allocation. In reality though, the initial allocation is preserved at the first timestamp after which it usually starts to deviate. That's why it requires periodic or threshold rebalancing to preserve the allocation throughout the whole period.

#### Custom array[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#custom-array "Permanent link")

If we already have an array with allocations in either compressed or filled form, we can use [PortfolioOptimizer.from\_allocations](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_allocations) and [PortfolioOptimizer.from\_filled\_allocations](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_filled_allocations) respectively.

Let's create a compressed array with our own quarter allocations:

```
>>> custom_index = vbt.date_range("2020-01-01", "2021-01-01", freq="Q")
>>> custom_allocations = pd.DataFrame(
...     [
...         [0.5, 0.2, 0.1, 0.1, 0.1],
...         [0.1, 0.5, 0.2, 0.1, 0.1],
...         [0.1, 0.1, 0.5, 0.2, 0.1],
...         [0.1, 0.1, 0.1, 0.5, 0.2]
...     ],
...     index=custom_index, 
...     columns=symbol_wrapper.columns
... )

```

Whenever we pass a DataFrame, vectorbt automatically uses its index as `on` argument to place allocations at those (or next) timestamps in the original index:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocations(
...     symbol_wrapper,
...     allocations
... )
>>> pfo.allocations
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00      0.5      0.2      0.1      0.1      0.1
2020-04-01 00:00:00+00:00      0.1      0.5      0.2      0.1      0.1
2020-07-01 00:00:00+00:00      0.1      0.1      0.5      0.2      0.1
2020-10-01 00:00:00+00:00      0.1      0.1      0.1      0.5      0.2

```

But if we passed a NumPy array, vectorbt wouldn't be able to parse the dates, and so we would need to specify the index points manually:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocations(
...     symbol_wrapper,
...     custom_allocations.values,
...     start="2020-01-01",
...     end="2021-01-01",
...     every="Q"
... )
>>> pfo.allocations
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00      0.5      0.2      0.1      0.1      0.1
2020-04-01 00:00:00+00:00      0.1      0.5      0.2      0.1      0.1
2020-07-01 00:00:00+00:00      0.1      0.1      0.5      0.2      0.1
2020-10-01 00:00:00+00:00      0.1      0.1      0.1      0.5      0.2

```

Also, we can use allocations that have been already filled as input. In such a case, we don't even need to provide a wrapper - vectorbt will be able to parse it from the array itself (given it's a DataFrame, of course). The filled allocations are parsed by considering rows where all values are NaN as empty. Let's use the filled allocations from the previous optimizer as input to another optimizer:

```
>>> pfo = vbt.PortfolioOptimizer.from_filled_allocations(
...     pfo.fill_allocations()
... )
>>> pfo.allocations
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00      0.5      0.2      0.1      0.1      0.1
2020-04-01 00:00:00+00:00      0.1      0.5      0.2      0.1      0.1
2020-07-01 00:00:00+00:00      0.1      0.1      0.5      0.2      0.1
2020-10-01 00:00:00+00:00      0.1      0.1      0.1      0.5      0.2

```

Hint

You can re-run this cell any number of times - there is no information loss!

#### Templates[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#templates "Permanent link")

What about more complex allocation functions, how are we supposed to pass arguments to them? One of the coolest features of vectorbt (in my personal opinion) are templates, which act as some exotic kind of callbacks. Using templates, we can instruct vectorbt to run small snippets of code at various execution points, mostly whenever new information is available.

When a new index point is processed by [PortfolioOptimizer.from\_allocate\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_allocate_func), vectorbt substitutes all templates found in `*args` and `**kwargs` using the current context, and passes them to the allocation function. The template context consists of all arguments passed to the class method + the generated index points (`index_points`), the current iteration index (`i`), and the index point (`index_point`).

To make our example more interesting, let's allocate 100% to one asset at a time, rotationally:

```
>>> def rotation_allocate_func(wrapper, i):
...     weights = np.full(len(wrapper.columns), 0)
...     weights[i % len(wrapper.columns)] = 1
...     return weights

>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     rotation_allocate_func,
...     vbt.Rep("wrapper"),  
...     vbt.Rep("i"),
...     every="M"
... )

>>> pfo.plot().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/templates.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/templates.dark.svg#only-dark)

The same can be done using evaluation templates:

```
>>> def rotation_allocate_func(symbols, chosen_symbol):
...     return {s: 1 if s == chosen_symbol else 0 for s in symbols}

>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     rotation_allocate_func,
...     vbt.RepEval("wrapper.columns"),  
...     vbt.RepEval("wrapper.columns[i % len(wrapper.columns)]"),
...     every="M"
... )

>>> pfo.allocations
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00        1        0        0        0        0
2020-02-01 00:00:00+00:00        0        1        0        0        0
2020-03-01 00:00:00+00:00        0        0        1        0        0
2020-04-01 00:00:00+00:00        0        0        0        1        0
2020-05-01 00:00:00+00:00        0        0        0        0        1
2020-06-01 00:00:00+00:00        1        0        0        0        0
2020-07-01 00:00:00+00:00        0        1        0        0        0
2020-08-01 00:00:00+00:00        0        0        1        0        0
2020-09-01 00:00:00+00:00        0        0        0        1        0
2020-10-01 00:00:00+00:00        0        0        0        0        1
2020-11-01 00:00:00+00:00        1        0        0        0        0
2020-12-01 00:00:00+00:00        0        1        0        0        0

```

Hint

The allocation function can return a sequence of values (one per asset), a dictionary (with assets as keys), or even a Pandas Series (with assets as index), that is, anything that can be packed into a list and used as an input to a DataFrame. If some asset key hasn't been provided, its allocation will be NaN.

#### Groups[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#groups "Permanent link")

Testing a single combination of parameters is boring, that's why vectorbt deploys two different parameter combination features: arguments wrapped with the class [Param](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.Param) and group configs. The concept of the former is similar to that you might have already discovered in [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast): wrap a sequence of multiple values with this class to combine the argument with other arguments and/or similar parameters. Let's implement constant-weighting asset allocation with different rebalancing timings:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     const_allocate_func,
...     [0.5, 0.2, 0.1, 0.1, 0.1],
...     every=vbt.Param(["1M", "2M", "3M"])  
... )

>>> pf = pfo.simulate(data, freq="1h")
>>> pf.total_return
every
1M    3.716574
2M    3.435540
3M    3.516401
Name: total_return, dtype: float64

```

Hint

To hide the progress bar, pass `execute_kwargs=dict(show_progress=False)`.

As we can see, vectorbt figured out that the argument `every` is a parameter, and thus it has created a column level named by the argument and placed it on top of the symbol columns.

Let's define another parameter for weights:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     const_allocate_func,
...     vbt.Param([
...         [0.5, 0.2, 0.1, 0.1, 0.1],
...         [0.2, 0.1, 0.1, 0.1, 0.5]
...     ], keys=pd.Index(["w1", "w2"], name="weights")),  
...     every=vbt.Param(["1M", "2M", "3M"])
... )

```

This code has generated 6 different parameter combinations (i.e., groups):

```
>>> pfo.wrapper.grouper.get_index()
MultiIndex([('1M', 'w1'),
            ('1M', 'w2'),
            ('2M', 'w1'),
            ('2M', 'w2'),
            ('3M', 'w1'),
            ('3M', 'w2')],
           names=['every', 'weights'])

```

And applied each one on our asset columns:

```
>>> pfo.wrapper.columns
MultiIndex([('1M', 'w1', 'ADAUSDT'),
            ('1M', 'w1', 'BNBUSDT'),
            ('1M', 'w1', 'BTCUSDT'),
            ...
            ('3M', 'w2', 'BTCUSDT'),
            ('3M', 'w2', 'ETHUSDT'),
            ('3M', 'w2', 'XRPUSDT')],
           names=['every', 'weights', 'symbol'])

```

To select or plot the allocations corresponding to any parameter combination, we can use Pandas-like indexing **on groups**:

```
>>> pfo[("3M", "w2")].stats()
Start                       2020-01-01 00:00:00+00:00
End                         2020-12-31 23:00:00+00:00
Period                              365 days 06:00:00
Total Records                                       4
Mean Allocation: ADAUSDT                          0.2
Mean Allocation: BNBUSDT                          0.1
Mean Allocation: BTCUSDT                          0.1
Mean Allocation: ETHUSDT                          0.1
Mean Allocation: XRPUSDT                          0.5
Name: (3M, w2), dtype: object

```

Note

When plotting and instead of indexing, we can provide a group name or tuple via the `column` argument.

But what about more complex groups? Representing every bit of information using parameters may be cumbersome when arguments hardly overlap. Gladly, we can use the argument `group_configs` to pass a list of dictionaries, each representing a single group and defining its arguments. Let's apply this approach to the example above:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     const_allocate_func,
...     group_configs=[
...         dict(args=([0.5, 0.2, 0.1, 0.1, 0.1],), every="1M"),
...         dict(args=([0.2, 0.1, 0.1, 0.1, 0.5],), every="2M"),
...         dict(args=([0.1, 0.1, 0.1, 0.5, 0.2],), every="3M"),
...         dict(args=([0.1, 0.1, 0.5, 0.2, 0.1],), every="1M"),
...         dict(args=([0.1, 0.5, 0.2, 0.1, 0.1],), every="2M"),
...         dict(args=([0.5, 0.2, 0.1, 0.1, 0.1],), every="3M"),
...     ]
... )
pfo.wrapper.grouper.get_index()
Int64Index([0, 1, 2, 3, 4, 5], dtype='int64', name='group_config')

```

In contrast to the previous example, where vectorbt has created two column levels corresponding to both parameters, this example produced only one where each number represents the index of a group config. Let's do something more fun: create one group that does the constant allocation and one group that does the random allocation!

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     const_allocate_func,
...     group_configs=[
...         dict(
...             allocate_func=const_allocate_func, 
...             args=([0.5, 0.2, 0.1, 0.1, 0.1],),
...             _name="const"  
...         ),
...         dict(
...             allocate_func=random_allocate_func,
...             every="M",
...             _name="random"
...         ),
...     ]
... )
>>> pfo.wrapper.grouper.get_index()
Index(['const', 'random'], dtype='object', name='group_config')

```

We can also combine [Param](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.Param) instances and group configs for the highest flexibility:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     const_allocate_func,
...     group_configs={  
...         "const": dict(
...             allocate_func=const_allocate_func, 
...             args=([0.5, 0.2, 0.1, 0.1, 0.1],)
...         ),
...         "random": dict(
...             allocate_func=random_allocate_func,
...         ),
...     },
...     every=vbt.Param(["1M", "2M", "3M"])  
... )
>>> pfo.wrapper.grouper.get_index()
MultiIndex([('1M',  'const'),
            ('1M', 'random'),
            ('2M',  'const'),
            ('2M', 'random'),
            ('3M',  'const'),
            ('3M', 'random')],
           names=['every', 'group_config'])

```

Info

The column levels for parameters are always placed above the column levels for group configs.

#### Numba[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#numba "Permanent link")

By default, vectorbt iterates over index points using a regular Python for-loop. This has almost no impact on performance if the number of allocations is kept low, which is usually the case in portfolio optimization. This is because running the actual allocation function takes much more time compared to a single iteration of a loop. But when the number of iterations crosses tens of thousands, we might be interested in iterating using Numba.

To use Numba, enable `jitted_loop`. In this case, index points will be iterated using [allocate\_meta\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/nb/#vectorbtpro.portfolio.pfopt.nb.allocate_meta_nb), which passes the current iteration index, the current index point, and `*args`.

Note

Variable keyword arguments are not supported by Numba (yet).

Let's implement the rotational example using Numba, but now rebalancing every day:

```
>>> @njit
... def rotation_allocate_func_nb(i, idx, n_cols):
...     weights = np.full(n_cols, 0)
...     weights[i % n_cols] = 1
...     return weights

>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     rotation_allocate_func_nb,
...     vbt.RepEval("len(wrapper.columns)"),
...     every="D",
...     jitted_loop=True
... )

>>> pfo.allocations.head()
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-05 00:00:00+00:00      1.0      0.0      0.0      0.0      0.0
2020-01-12 00:00:00+00:00      0.0      1.0      0.0      0.0      0.0
2020-01-19 00:00:00+00:00      0.0      0.0      1.0      0.0      0.0
2020-01-26 00:00:00+00:00      0.0      0.0      0.0      1.0      0.0
2020-02-02 00:00:00+00:00      0.0      0.0      0.0      0.0      1.0

```

#### Distribution[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#distribution "Permanent link")

If you aim for best performance, there is a possibility to run the allocation function in a distributed manner, given that each function call doesn't depend on the result of any function call before (which is only the case when you store something in a custom variable anyway).

Whenever the jitted loop is disabled, vectorbt sends all iterations to the [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute) function, which is the vectorbt's in-house function execution infrastructure. This is similar to how multiple parameter combinations can be distributed when running indicators, and in fact, there is the same argument `execute_kwargs` that allows us to control the overall execution.

Let's disable the jitted loop and pass all the arguments required by our Numba-compiled function `rotation_allocate_func_nb` using templates (since the function isn't called by [allocate\_meta\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/nb/#vectorbtpro.portfolio.pfopt.nb.allocate_meta_nb) anymore!):

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     rotation_allocate_func_nb,
...     vbt.Rep("i"),
...     vbt.Rep("index_point"),
...     vbt.RepEval("len(wrapper.columns)"),
...     every="D",
...     execute_kwargs=dict(engine="dask")
... )

>>> pfo.allocations.head()
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00        1        0        0        0        0
2020-01-02 00:00:00+00:00        0        1        0        0        0
2020-01-03 00:00:00+00:00        0        0        1        0        0
2020-01-04 00:00:00+00:00        0        0        0        1        0
2020-01-05 00:00:00+00:00        0        0        0        0        1

```

There is another great option for distributing the allocation process: by enabling the jitted loop with [allocate\_meta\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/nb/#vectorbtpro.portfolio.pfopt.nb.allocate_meta_nb) and chunking! This way, we can split the index points into chunks and iterate over each chunk without leaving Numba. We can control the chunking process using the `chunked` argument, which is resolved and forwarded down to [chunked](https://vectorbt.pro/pvt_40509f46/api/utils/chunking/#vectorbtpro.utils.chunking.chunked). We should just make sure that we provide the chunking specification for all additional arguments required by the allocation function:

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     rotation_allocate_func_nb,
...     vbt.RepEval("len(wrapper.columns)"),
...     every="D",
...     jitted_loop=True,
...     chunked=dict(
...         arg_take_spec=dict(args=vbt.ArgsTaker(None)),  
...         engine="dask"
...     )
... )
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00      1.0      0.0      0.0      0.0      0.0
2020-01-02 00:00:00+00:00      0.0      1.0      0.0      0.0      0.0
2020-01-03 00:00:00+00:00      0.0      0.0      1.0      0.0      0.0
2020-01-04 00:00:00+00:00      0.0      0.0      0.0      1.0      0.0
2020-01-05 00:00:00+00:00      0.0      0.0      0.0      0.0      1.0

```

If you aren't tired of so many distribution options, here's another one: parallelize the iteration internally using Numba. This is possible by using the `jitted` argument, which is resolved and forwarded down to the `@njit` decorator of [allocate\_meta\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/nb/#vectorbtpro.portfolio.pfopt.nb.allocate_meta_nb):

```
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     rotation_allocate_func_nb,
...     vbt.RepEval("len(wrapper.columns)"),
...     every="D",
...     jitted_loop=True,
...     jitted=dict(parallel=True)
... )

>>> pfo.allocations.head()
symbol                     ADAUSDT  BNBUSDT  BTCUSDT  ETHUSDT  XRPUSDT
Open time                                                             
2020-01-01 00:00:00+00:00      1.0      0.0      0.0      0.0      0.0
2020-01-02 00:00:00+00:00      0.0      1.0      0.0      0.0      0.0
2020-01-03 00:00:00+00:00      0.0      0.0      1.0      0.0      0.0
2020-01-04 00:00:00+00:00      0.0      0.0      0.0      1.0      0.0
2020-01-05 00:00:00+00:00      0.0      0.0      0.0      0.0      1.0

```

#### Previous allocation[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#previous-allocation "Permanent link")

To access the allocation generated in the previous step, we have to disable any distribution (that is, run the allocation function in a serial manner) and create a temporary list or any other container that will hold all the generated allocations. Whenever the allocation function is called, generate a new allocation and put it into that container, which can be accessed by the next allocation point. Let's slightly randomize each previous allocation to get a new one:

```
>>> def randomize_prev_allocate_func(i, allocations, mean, std):
...     if i == 0:
...         return allocations[0]  
...     prev_allocation = allocations[-1]  
...     log_returns = np.random.uniform(mean, std, size=len(prev_allocation))  
...     returns = np.exp(log_returns) - 1  
...     new_allocation = prev_allocation * (1 + returns)  
...     new_allocation = new_allocation / new_allocation.sum()  
...     allocations.append(new_allocation)  
...     return new_allocation

>>> np.random.seed(42)

>>> n_symbols = len(symbol_wrapper.columns)
>>> init_allocation = np.full(n_symbols, 1 / n_symbols)
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     randomize_prev_allocate_func,
...     i=vbt.Rep("i"),  
...     allocations=[init_allocation],  
...     mean=0,
...     std=0.5,
...     every="W",
...     start=0,  
...     exact_start=True
... )

>>> pfo.plot().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/prev_allocation.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/prev_allocation.dark.svg#only-dark)

#### Current allocation[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#current-allocation "Permanent link")

We know how to access the previous allocation, but it has certainly changed over time, so how do we access the current (updated) allocation? We can simply forward-simulate it!

```
>>> def current_allocate_func(price, index_point, alloc_info):
...     prev_alloc_info = alloc_info[-1]
...     prev_index_point = prev_alloc_info["index_point"]
...     prev_allocation = prev_alloc_info["allocation"]
...     if prev_index_point is None:
...         current_allocation = prev_allocation
...     else:
...         prev_price_period = price.iloc[prev_index_point:index_point]  
...         prev_pfo = vbt.PFO.from_initial(prev_price_period.vbt.wrapper, prev_allocation)  
...         prev_pf = prev_pfo.simulate(prev_price_period)
...         current_allocation = prev_pf.allocations.iloc[-1]  
...     alloc_info.append(dict(  
...         index_point=index_point,
...         allocation=current_allocation,
...     ))
...     return current_allocation

>>> n_symbols = len(symbol_wrapper.columns)
>>> init_allocation = np.full(n_symbols, 1 / n_symbols)
>>> pfo = vbt.PortfolioOptimizer.from_allocate_func(
...     symbol_wrapper,
...     current_allocate_func,
...     price=data.get("Close"),
...     index_point=vbt.Rep("index_point"),
...     alloc_info=[dict(index_point=None, allocation=init_allocation)],  
...     every="W",
...     start=0,
...     exact_start=True
... )
>>> pfo.plot().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/current_allocation.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/current_allocation.dark.svg#only-dark)

The code above accesses the previous allocation, forward-simulates it, and then uses the last allocation of the simulated portfolio as the new allocation, which is identical to simulating just the very first allocation ![✨](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/2728.svg ":sparkles:")

```
>>> init_pfo = vbt.PFO.from_initial(symbol_wrapper, init_allocation)
>>> continuous_pf = pfo.simulate(data.get("Close"))
>>> index_points = symbol_wrapper.get_index_points(every="W", start=0, exact_start=True)
>>> discrete_pfo = vbt.PFO.from_allocations(symbol_wrapper, continuous_pf.allocations.iloc[index_points])
>>> discrete_pfo.plot().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/current_allocation.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/current_allocation.dark.svg#only-dark)

## Optimization[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#optimization "Permanent link")

Allocation periodically is fun but provides a somewhat limited machinery for what can be done. Consider a typical scenario where we want to rebalance based on a window of data rather than based on specific points in time. Using an allocation function, we would have had to additionally keep track of previous allocation or lookback period. To make things a bit easier for us, vectorbt implements an "optimization" function, which works on a range of timestamps.

### Index ranges[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#index-ranges "Permanent link")

Similar to index points, index ranges is also a collection of indices, but each element is a range of index rather than a single point. In vectorbt, index ranges are typically represented by a two-dimensional NumPy array where the first column holds range start indices (including) and the second column holds range end indices (excluding). And similarly to how we translated human-readable queries into an array with indices using [ArrayWrapper.get\_index\_points](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.get_index_points), we can translate similar queries into index ranges using [ArrayWrapper.get\_index\_ranges](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.get_index_ranges).

Let's demonstrate usage of this method by splitting the entire period into month ranges:

```
>>> example_ranges = data.wrapper.get_index_ranges(every="M")
>>> example_ranges[0]
array([0, 744, 1434, 2177, 2895, 3639, 4356, 5100, 5844, 6564, 7308])

>>> example_ranges[1]
array([744, 1434, 2177, 2895, 3639, 4356, 5100, 5844, 6564, 7308, 8027])

```

What happened is the following: vectorbt created a new datetime index with a monthly frequency, and created a range from each pair of values in that index.

To translate each index range back into timestamps:

```
>>> data.wrapper.index[example_ranges[0][0]:example_ranges[1][0]]  
DatetimeIndex(['2020-01-01 00:00:00+00:00', '2020-01-01 01:00:00+00:00',
               '2020-01-01 02:00:00+00:00', '2020-01-01 03:00:00+00:00',
               '2020-01-01 04:00:00+00:00', '2020-01-01 05:00:00+00:00',
               ...
               '2020-01-31 18:00:00+00:00', '2020-01-31 19:00:00+00:00',
               '2020-01-31 20:00:00+00:00', '2020-01-31 21:00:00+00:00',
               '2020-01-31 22:00:00+00:00', '2020-01-31 23:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', length=744, freq=None)

```

Important

The right bound (second column) is always excluding, thus you shouldn't use it for indexing because it can point to an element that exceeds the length of the index.

We see that the first range covers values from `2020-01-01` to `2020-01-31` - a month in time.

In cases where we want to look back for a pre-determined period of time rather than up to the previous allocation timestamp, we can use the `lookback_period` argument. Below, we are generating new indices each month while looking back for 3 months:

```
>>> example_ranges = data.wrapper.get_index_ranges(
...     every="M", 
...     lookback_period="3M"  
... )

>>> def get_index_bounds(range_starts, range_ends):  
...     for i in range(len(range_starts)):
...         start_idx = range_starts[i]  
...         end_idx = range_ends[i]  
...         range_index = data.wrapper.index[start_idx:end_idx]
...         yield range_index[0], range_index[-1]

>>> list(get_index_bounds(*example_ranges))
[(Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-03-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-02-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-04-30 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-03-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-05-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-04-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-06-30 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-05-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-07-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-06-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-08-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-07-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-09-30 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-08-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-10-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-09-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-11-30 23:00:00+0000', tz='UTC'))]

```

But what if we know exactly at which date each range should start and/or end? In contrast to index points, the `start` and `end` arguments can be collections of indices or timestamps denoting the range bounds:

```
>>> example_ranges = data.wrapper.get_index_ranges(
...     start=["2020-01-01", "2020-04-01", "2020-08-01"],
...     end=["2020-04-01", "2020-08-01", "2020-12-01"]
... )

>>> list(get_index_bounds(*example_ranges))
[(Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-03-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-04-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-07-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-08-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-11-30 23:00:00+0000', tz='UTC'))]

```

Hint

We can mark the first timestamp as excluding and the last timestamp as including by setting `closed_start` to False and `closed_end` to True respectively. Note that these conditions are applied on the input, while the output is still following the schema _from including to excluding_.

In addition, if `start` or `end` is a single value, it will automatically broadcast to match the length of another argument. Let's simulate the movement of an expanding window:

```
>>> example_ranges = data.wrapper.get_index_ranges(
...     start="2020-01-01",
...     end=["2020-04-01", "2020-08-01", "2020-12-01"]
... )

>>> list(get_index_bounds(*example_ranges))
[(Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-03-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-07-31 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-11-30 23:00:00+0000', tz='UTC'))]

```

Another argument worth mentioning is `fixed_start`, which combined with `every` can also simulate an expanding window:

```
>>> example_ranges = data.wrapper.get_index_ranges(
...     every="Q",
...     exact_start=True,  
...     fixed_start=True
... )

>>> list(get_index_bounds(*example_ranges))
[(Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-03-30 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-06-29 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-09-29 23:00:00+0000', tz='UTC')),
 (Timestamp('2020-01-01 00:00:00+0000', tz='UTC'),
  Timestamp('2020-12-30 23:00:00+0000', tz='UTC'))]

```

### Optimization method[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#optimization-method "Permanent link")

Just like [PortfolioOptimizer.from\_allocate\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_allocate_func), which is applied on index points, there a class method [PortfolioOptimizer.from\_optimize\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_optimize_func), which is applied on index ranges. The workings of this method are almost identical to its counterpart, except that each iteration calls an optimization function `optimize_func` that is concerned with an index range (available as `index_slice` via the template context), and all index ranges are stored as records of type [AllocRanges](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/records/#vectorbtpro.portfolio.pfopt.records.AllocRanges), which is a subclass of [Ranges](https://vectorbt.pro/pvt_40509f46/api/generic/ranges/#vectorbtpro.generic.ranges.Ranges).

Let's do something simple: allocate inversely proportional to the return of an asset. This will allocate more to assets that have been performing poorly in an expectation that we will buy them at a discounted price and they will turn bullish in the upcoming time period.

```
>>> def inv_rank_optimize_func(price, index_slice):
...     price_period = price.iloc[index_slice]  
...     first_price = price_period.iloc[0]
...     last_price = price_period.iloc[-1]
...     ret = (last_price - first_price) / first_price  
...     ranks = ret.rank(ascending=False)  
...     return ranks / ranks.sum()  

>>> pfo = vbt.PortfolioOptimizer.from_optimize_func(
...     symbol_wrapper,
...     inv_rank_optimize_func,
...     data.get("Close"),
...     vbt.Rep("index_slice"),  
...     every="M"
... )

>>> pfo.allocations
symbol                      ADAUSDT   BNBUSDT   BTCUSDT   ETHUSDT   XRPUSDT
Open time                                                                  
2020-02-01 00:00:00+00:00  0.066667  0.200000  0.266667  0.133333  0.333333
2020-03-01 00:00:00+00:00  0.333333  0.133333  0.266667  0.066667  0.200000
2020-04-01 00:00:00+00:00  0.266667  0.200000  0.133333  0.333333  0.066667
2020-05-01 00:00:00+00:00  0.066667  0.200000  0.266667  0.133333  0.333333
2020-06-01 00:00:00+00:00  0.066667  0.266667  0.200000  0.133333  0.333333
2020-07-01 00:00:00+00:00  0.066667  0.266667  0.200000  0.133333  0.333333
2020-08-01 00:00:00+00:00  0.066667  0.266667  0.333333  0.133333  0.200000
2020-09-01 00:00:00+00:00  0.333333  0.133333  0.266667  0.066667  0.200000
2020-10-01 00:00:00+00:00  0.266667  0.066667  0.133333  0.333333  0.200000
2020-11-01 00:00:00+00:00  0.333333  0.266667  0.066667  0.133333  0.200000
2020-12-01 00:00:00+00:00  0.133333  0.333333  0.266667  0.200000  0.066667

```

To select the index range from an array automatically, we can wrap the array with [Takeable](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/base/#vectorbtpro.generic.splitting.base.Takeable):

```
>>> def inv_rank_optimize_func(price):
...     first_price = price.iloc[0]
...     last_price = price.iloc[-1]
...     ret = (last_price - first_price) / first_price
...     ranks = ret.rank(ascending=False)
...     return ranks / ranks.sum()

>>> pfo = vbt.PortfolioOptimizer.from_optimize_func(
...     symbol_wrapper,
...     inv_rank_optimize_func,
...     vbt.Takeable(data.get("Close")),
...     every="M"
... )

```

Hint

Although this approach introduces a tiny overhead, it has a key advantage over the manual approach: VBT knows how to select an index range even if the takeable array is a Pandas object with an index or frequency different from that of the optimization. This is possible thanks to VBT's robust resampling.

To validate the allocation array, we first need to access the index ranges that our portfolio optimization was performed upon, which are stored under the same attribute as index points - [PortfolioOptimizer.alloc\_records](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.alloc_records):

```
>>> pfo.alloc_records.records_readable
    Range Id  Group               Start Index                 End Index  \
0          0  group 2020-01-01 00:00:00+00:00 2020-02-01 00:00:00+00:00   
1          1  group 2020-02-01 00:00:00+00:00 2020-03-01 00:00:00+00:00   
2          2  group 2020-03-01 00:00:00+00:00 2020-04-01 00:00:00+00:00   
3          3  group 2020-04-01 00:00:00+00:00 2020-05-01 00:00:00+00:00   
4          4  group 2020-05-01 00:00:00+00:00 2020-06-01 00:00:00+00:00   
5          5  group 2020-06-01 00:00:00+00:00 2020-07-01 00:00:00+00:00   
6          6  group 2020-07-01 00:00:00+00:00 2020-08-01 00:00:00+00:00   
7          7  group 2020-08-01 00:00:00+00:00 2020-09-01 00:00:00+00:00   
8          8  group 2020-09-01 00:00:00+00:00 2020-10-01 00:00:00+00:00   
9          9  group 2020-10-01 00:00:00+00:00 2020-11-01 00:00:00+00:00   
10        10  group 2020-11-01 00:00:00+00:00 2020-12-01 00:00:00+00:00   

            Allocation Index  Status  
0  2020-02-01 00:00:00+00:00  Closed  
1  2020-03-01 00:00:00+00:00  Closed  
2  2020-04-01 00:00:00+00:00  Closed  
3  2020-05-01 00:00:00+00:00  Closed  
4  2020-06-01 00:00:00+00:00  Closed  
5  2020-07-01 00:00:00+00:00  Closed  
6  2020-08-01 00:00:00+00:00  Closed  
7  2020-09-01 00:00:00+00:00  Closed  
8  2020-10-01 00:00:00+00:00  Closed  
9  2020-11-01 00:00:00+00:00  Closed  
10 2020-12-01 00:00:00+00:00  Closed  

```

We see three different types of timestamps: a start (`start_idx`), an end (`end_idx`), and an allocation timestamp (`alloc_idx`). The start and end ones contain our index ranges, while the allocation ones contain the timestamps were the allocations were actually placed. By default, vectorbt places an allocation at the end of each index range. In cases where the end index exceeds the bounds (remember that it's an excluded index), the status of the range is marked as "Open", otherwise as "Closed" (which means we can safely use that allocation). Allocation and filled allocation arrays contain only closed allocations.

Hint

Use `alloc_wait` argument to control the number of ticks after which the allocation should be placed. The default is `1`. Passing `0` will place the allocation at the last tick in the index range, which should be used with caution when optimizing based on the close price.

Let's validate the allocation that was generated based on the first month of data:

```
>>> start_idx = pfo.alloc_records.values[0]["start_idx"]
>>> end_idx = pfo.alloc_records.values[0]["end_idx"]
>>> close_period = data.get("Close").iloc[start_idx:end_idx]
>>> close_period.vbt.rebase(1).vbt.plot().show()  

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/close_period.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/close_period.dark.svg#only-dark)

We see that `ADAUSDT` recorded the highest return and `XRPUSDT` the lowest, which has been correctly translated into the allocation of only 6% to the former and 33% to the latter.

Having index ranges instead of index points stored in a [PortfolioOptimizer](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer) instance also opens new metrics and subplots:

```
>>> pfo.stats()
Start                       2020-01-01 00:00:00+00:00
End                         2020-12-31 23:00:00+00:00
Period                              365 days 06:00:00
Total Records                                      11
Coverage                                     0.915593  << ranges cover 92%
Overlap Coverage                                  0.0  << ranges do not overlap
Mean Allocation: ADAUSDT                     0.181818
Mean Allocation: BNBUSDT                     0.212121
Mean Allocation: BTCUSDT                     0.218182
Mean Allocation: ETHUSDT                     0.163636
Mean Allocation: XRPUSDT                     0.224242
Name: group, dtype: object

>>> pfo.plots().show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/plots.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/tutorials/pf-opt/plots.dark.svg#only-dark)

In the graph above we see not only when each re-allocation takes place, but also which index range that re-allocation is based upon.

All other features such as [support for groups](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#groups) are identical to [PortfolioOptimizer.from\_allocate\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_allocate_func).

#### Waiting[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#waiting "Permanent link")

By default, when generating weights over a specific time period, the weights will be allocated at the next possible timestamp. This has some implications. For example, when calling [PortfolioOptimizer.from\_optimize\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/base/#vectorbtpro.portfolio.pfopt.base.PortfolioOptimizer.from_optimize_func) without any arguments, it will optimize over the whole time period but return no allocations because there is no next timestamp to allocate the generated weights at:

```
>>> pfo = vbt.PortfolioOptimizer.from_optimize_func(
...     symbol_wrapper,
...     inv_rank_optimize_func,
...     vbt.Takeable(data.get("Close"))
... )
>>> pfo.allocations
Empty DataFrame
Columns: [BTCUSDT, ETHUSDT, BNBUSDT, XRPUSDT, ADAUSDT]
Index: []

```

The solution is to set the waiting time to zero:

```
>>> pfo = vbt.PortfolioOptimizer.from_optimize_func(
...     symbol_wrapper,
...     inv_rank_optimize_func,
...     vbt.Takeable(data.get("Close")),
...     alloc_wait=0  
... )
>>> pfo.allocations
symbol                     BTCUSDT   ETHUSDT   BNBUSDT   XRPUSDT   ADAUSDT
Open time                                                                 
2020-12-31 23:00:00+00:00      0.2  0.066667  0.266667  0.333333  0.133333

```

#### Numba[¶](https://vectorbt.pro/pvt_40509f46/tutorials/portfolio-optimization/#numba_1 "Permanent link")

Let's perform both the iteration and optimization strictly using Numba. The only difference compared to a Numba-compiled allocation function is that an optimization function takes two arguments instead of one: range start and end index. Under the hood, the iteration and execution is performed by [optimize\_meta\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/pfopt/nb/#vectorbtpro.portfolio.pfopt.nb.optimize_meta_nb).

```
>>> @njit
... def inv_rank_optimize_func_nb(i, start_idx, end_idx, price):
...     price_period = price[start_idx:end_idx]
...     first_price = price_period[0]
...     last_price = price_period[-1]
...     ret = (last_price - first_price) / first_price
...     ranks = vbt.nb.rank_1d_nb(-ret)  
...     return ranks / ranks.sum()

>>> pfo = vbt.PortfolioOptimizer.from_optimize_func(
...     symbol_wrapper,
...     inv_rank_optimize_func_nb,
...     data.get("Close").values,  
...     every="M",
...     jitted_loop=True
... )

>>> pfo.allocations
symbol                      ADAUSDT   BNBUSDT   BTCUSDT   ETHUSDT   XRPUSDT
Open time                                                                  
2020-02-01 00:00:00+00:00  0.066667  0.200000  0.266667  0.133333  0.333333
2020-03-01 00:00:00+00:00  0.333333  0.133333  0.266667  0.066667  0.200000
2020-04-01 00:00:00+00:00  0.266667  0.200000  0.133333  0.333333  0.066667
2020-05-01 00:00:00+00:00  0.066667  0.200000  0.266667  0.133333  0.333333
2020-06-01 00:00:00+00:00  0.066667  0.266667  0.200000  0.133333  0.333333
2020-07-01 00:00:00+00:00  0.066667  0.266667  0.200000  0.133333  0.333333
2020-08-01 00:00:00+00:00  0.066667  0.266667  0.333333  0.133333  0.200000
2020-09-01 00:00:00+00:00  0.333333  0.133333  0.266667  0.066667  0.200000
2020-10-01 00:00:00+00:00  0.266667  0.066667  0.133333  0.333333  0.200000
2020-11-01 00:00:00+00:00  0.333333  0.266667  0.066667  0.133333  0.200000
2020-12-01 00:00:00+00:00  0.133333  0.333333  0.266667  0.200000  0.066667

```

The adaptation to Numba is rather easy, right? ![😉](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f609.svg ":wink:")

But the speedup from such compilation is immense, especially when tons of re-allocation steps and/or parameter combinations are involved. Try it for yourself!

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/tutorials/portfolio-optimization/index.py.txt) [Notebook](https://github.com/polakowo/vectorbt.pro/blob/main/notebooks/PortfolioOptimization.ipynb)