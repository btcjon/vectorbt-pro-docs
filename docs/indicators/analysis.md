---
id: analysis
title: Indicator Analysis
sidebar_label: Analysis
---

To analyze an indicator, we can use the indicator instance returned by the `run` method.

## Helper methods[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#helper-methods "Permanent link")

Whenever we create an instance of [IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory), it builds and sets up an indicator class. During this setup, the factory attaches many interesting attributes to the class. For instance, for each in `input_names`, `in_output_names`, `output_names`, and `lazy_outputs`, it will create and attach a bunch of comparison and combination methods. What characteristics any of these attributes should have can be regulated in the `attr_settings` dictionary.

Let's modify the class `CrossSig` created earlier by replacing the entries and exits with a single signal array and also returning an enumerated array that contains the signal type. We will also specify the data type of each array in the `attr_settings` dictionary:

```
>>> from vectorbtpro import *

>>> SignalType = namedtuple('SigType', ['Entry', 'Exit'])(0, 1)  

>>> def apply_func(ts, fastw, sloww, minp=None):
...     fast_ma = vbt.nb.rolling_mean_nb(ts, fastw, minp=minp)
...     slow_ma = vbt.nb.rolling_mean_nb(ts, sloww, minp=minp)
...     entries = vbt.nb.crossed_above_nb(fast_ma, slow_ma)
...     exits = vbt.nb.crossed_above_nb(slow_ma, fast_ma)
...     signals = entries | exits
...     signal_type = np.full(ts.shape, -1, dtype=int_)  
...     signal_type[entries] = SignalType.Entry
...     signal_type[exits] = SignalType.Exit
...     return (fast_ma, slow_ma, signals, signal_type)

>>> CrossSig = vbt.IF(
...     class_name="CrossSig",
...     input_names=['ts'],
...     param_names=['fastw', 'sloww'],
...     output_names=['fast_ma', 'slow_ma', 'signals', 'signal_type'],
...     attr_settings=dict(
...         fast_ma=dict(dtype=float_),
...         slow_ma=dict(dtype=float_),
...         signals=dict(dtype=np.bool_),
...         signal_type=dict(dtype=SignalType),
...     )
... ).with_apply_func(apply_func)

>>> def generate_index(n):
...     return vbt.date_range("2020-01-01", periods=n)

>>> ts = pd.DataFrame({
...     'a': [1, 2, 3, 2, 1, 2, 3],
...     'b': [3, 2, 1, 2, 3, 2, 1]
... }, index=generate_index(7))
>>> cross_sig = CrossSig.run(ts, 2, 3)

```

We can explore the helper methods that were attached using the Python's `dir` command:

```
>>> dir(cross_sig)
...
'fast_ma',
'fast_ma_above',
'fast_ma_below',
'fast_ma_crossed_above',
'fast_ma_crossed_below',
'fast_ma_equal',
'fast_ma_stats',
...
'signal_type',
'signal_type_readable',
'signal_type_stats',
...
'signals',
'signals_and',
'signals_or',
'signals_stats',
'signals_xor',
...
'slow_ma',
'slow_ma_above',
'slow_ma_below',
'slow_ma_crossed_above',
'slow_ma_crossed_below',
'slow_ma_equal',
'slow_ma_stats',
...
'ts',
'ts_above',
'ts_below',
'ts_crossed_above',
'ts_crossed_below',
'ts_equal',
'ts_stats',

```

One helper method that appears for each array is `stats`, which calls [StatsBuilderMixin.stats](https://vectorbt.pro/pvt_40509f46/api/generic/stats_builder/#vectorbtpro.generic.stats_builder.StatsBuilderMixin.stats) on the accessor that corresponds to the data type of the array:

```
>>> cross_sig.fast_ma_stats(column=(2, 3, 'a'))  
Start        2020-01-01 00:00:00
End          2020-01-07 00:00:00
Period           7 days 00:00:00
Count                          6
Mean                         2.0
Std                     0.547723
Min                          1.5
Median                       2.0
Max                          2.5
Min Index    2020-01-02 00:00:00
Max Index    2020-01-03 00:00:00
Name: (2, 3, a), dtype: object

```

The same can be done manually:

```
>>> cross_sig.fast_ma.vbt.stats(column=(2, 3, 'a'))

```

### Numeric[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#numeric "Permanent link")

The factory generated the comparison methods `above`, `below`, and `equal` for the numeric arrays. Each of those methods is based on [combine\_objs](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.combine_objs), which in turn is based on [BaseAccessor.combine](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.combine). All operations are done strictly using NumPy. Another advantage is utilization of vectorbt's own broadcasting, such that we can combine the arrays with an arbitrary array-like object, given their shapes can broadcast together. We can also do comparison with multiple objects at once by passing them as a tuple or list.

Let's return True when the fast moving average is above a range of thresholds:

```
>>> cross_sig.fast_ma_above([2, 3])
crosssig_fast_ma_above             2             3
crosssig_fastw                     2             2
crosssig_sloww                     3             3
                            a      b      a      b
2020-01-01              False  False  False  False
2020-01-02              False   True  False  False
2020-01-03               True  False  False  False
2020-01-04               True  False  False  False
2020-01-05              False   True  False  False
2020-01-06              False   True  False  False
2020-01-07               True  False  False  False

```

Or, manually:

```
>>> cross_sig.fast_ma.vbt > vbt.Param([2, 3], name='crosssig_fast_ma_above')

```

Additionally, the factory attached the methods `crossed_above` and `crossed_below`, which are based on [GenericAccessor.crossed\_above](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.crossed_above) and [GenericAccessor.crossed\_below](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor.crossed_below) respectively.

```
>>> cross_sig.fast_ma_crossed_above(cross_sig.slow_ma)
crosssig_fastw             2
crosssig_sloww             3
                    a      b
2020-01-01      False  False
2020-01-02      False  False
2020-01-03      False  False
2020-01-04      False  False
2020-01-05      False   True
2020-01-06      False  False
2020-01-07       True  False

```

Or, manually:

```
>>> cross_sig.fast_ma.vbt.crossed_above(cross_sig.slow_ma)

```

### Boolean[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#boolean "Permanent link")

The factory generated the comparison methods `and`, `or`, and `xor` for the boolean arrays. Similarly to the methods generated for the numeric arrays, they are also based on [combine\_objs](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.combine_objs):

```
>>> other_signals = pd.Series([False, False, False, False, True, False, False])
>>> cross_sig.signals_and(other_signals)
crosssig_fastw             2
crosssig_sloww             3
                    a      b
2020-01-01      False  False
2020-01-02      False  False
2020-01-03      False  False
2020-01-04      False  False
2020-01-05       True   True
2020-01-06      False  False
2020-01-07      False  False

```

Or, manually:

```
>>> cross_sig.signals.vbt & other_signals

```

### Enumerated[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#enumerated "Permanent link")

Enumerated (or categorical) arrays, such as our `signal_type`, contain integer data that can be mapped to a certain category using a named tuple or any other enum. In contrast to the numeric and boolean arrays, comparing them with other arrays would make no sense. Thus, there is only one attached method - `readable` - that allows us to print the array in a human-readable format:

```
>>> cross_sig.signal_type_readable
crosssig_fastw             2
crosssig_sloww             3
                    a      b
2020-01-01       None   None
2020-01-02       None   None
2020-01-03       None   None
2020-01-04       None   None
2020-01-05       Exit  Entry
2020-01-06       None   None
2020-01-07      Entry   Exit

```

Hint

In vectorbt, if `-1` is not listed in the enum, it automatically means a missing value and gets replaced by `None`.

Or, manually:

```
>>> cross_sig.signal_type.vbt(mapping=SignalType).apply_mapping()

```

## Indexing[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#indexing "Permanent link")

Each indicator class subclasses [Analyzable](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#analyzing), so we can perform Pandas indexing on the indicator instance to select rows and columns in all Pandas objects. Supported operations are `iloc`, `loc`, `xs`, and `__getitem__`.

```
>>> cross_sig = CrossSig.run(ts, [2, 3], [3, 4], param_product=True)

>>> cross_sig.loc["2020-01-03":, (2, 3, 'a')]  
<vectorbtpro.indicators.factory.CrossSig at 0x7fcaf8e2f5c0>

>>> cross_sig.loc["2020-01-03":, (2, 3, 'a')].signals
2020-01-03    False
2020-01-04    False
2020-01-05     True
2020-01-06    False
2020-01-07     True
Name: (2, 3, a), dtype: bool

```

Additionally, [IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) uses the class factory function [build\_param\_indexer](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.build_param_indexer) to create an indexing class that enables Pandas indexing on each defined parameter. Since the indicator class subclasses this indexing class, we can use `*param_name*_loc` to select one or more values of any parameter.

```
>>> cross_sig.fastw_loc[2].sloww_loc[3]['a']  
<vectorbtpro.indicators.factory.CrossSig at 0x7fcac80742b0>

>>> cross_sig.fastw_loc[2].sloww_loc[3]['a'].signals
2020-01-01    False
2020-01-02    False
2020-01-03    False
2020-01-04    False
2020-01-05     True
2020-01-06    False
2020-01-07     True
Name: a, dtype: bool

```

This all makes possible accessing rows and columns by labels, integer positions, and parameters - full flexibility ![🤸♂️](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f938-200d-2642-fe0f.svg ":man_cartwheeling:")

## Stats and plots[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#stats-and-plots "Permanent link")

As with every [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable) instance, we can compute and plot various properties of the (input and output) data stored in the instance.

Metrics can be defined in two ways: by passing them via the `metrics` argument, or by subclassing the indicator class. The same applies to the `stats_defaults` argument, which can be provided either as a dictionary or a function, and which defines the default settings for [StatsBuilderMixin.stats](https://vectorbt.pro/pvt_40509f46/api/generic/stats_builder/#vectorbtpro.generic.stats_builder.StatsBuilderMixin.stats). Subplots can be defined in a similar way to metrics, except that they are set up by `subplots` and `plots_defaults` arguments, and invoked by [PlotsBuilderMixin.plots](https://vectorbt.pro/pvt_40509f46/api/generic/plots_builder/#vectorbtpro.generic.plots_builder.PlotsBuilderMixin.plots).

Let's define some metrics and subplots for `CrossSig`:

```
>>> metrics = dict(
...     start=dict(  
...         title='Start',
...         calc_func=lambda self: self.wrapper.index[0],
...         agg_func=None
...     ),
...     end=dict(  
...         title='End',
...         calc_func=lambda self: self.wrapper.index[-1],
...         agg_func=None
...     ),
...     period=dict(  
...         title='Period',
...         calc_func=lambda self: len(self.wrapper.index),
...         apply_to_timedelta=True,
...         agg_func=None
...     ),
...     fast_stats=dict(  
...         title="Fast Stats",
...         calc_func=lambda self: 
...         self.fast_ma.describe()\
...         .loc[['count', 'mean', 'std', 'min', 'max']]\
...         .vbt.to_dict(orient='index_series')
...     ),
...     slow_stats=dict(
...         title="Slow Stats",
...         calc_func=lambda self: 
...         self.slow_ma.describe()\
...         .loc[['count', 'mean', 'std', 'min', 'max']]\
...         .vbt.to_dict(orient='index_series')
...     ),
...     num_entries=dict(  
...         title="Entries",
...         calc_func=lambda self: 
...         np.sum(self.signal_type == SignalType.Entry)
...     ),
...     num_exits=dict(
...         title="Exits",
...         calc_func=lambda self: 
...         np.sum(self.signal_type == SignalType.Exit)
...     )
... )

>>> def plot_mas(self, column=None, add_trace_kwargs=None, fig=None):  
...     ts = self.select_col_from_obj(self.ts, column).rename('TS')  
...     fast_ma = self.select_col_from_obj(self.fast_ma, column).rename('Fast MA')
...     slow_ma = self.select_col_from_obj(self.slow_ma, column).rename('Slow MA')
...     ts.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...     fast_ma.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)  
...     slow_ma.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)

>>> def plot_signals(self, column=None, add_trace_kwargs=None, fig=None):
...     signal_type = self.select_col_from_obj(self.signal_type, column)
...     entries = (signal_type == SignalType.Entry).rename('Entries')
...     exits = (signal_type == SignalType.Exit).rename('Exits')
...     entries.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...     exits.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)

>>> subplots = dict(
...     mas=dict(
...         title="Moving averages",
...         plot_func=plot_mas
...     ),
...     signals=dict(
...         title="Signals",
...         plot_func=plot_signals
...     )
... )

>>> CrossSig = vbt.IF(
...     class_name="CrossSig",
...     input_names=['ts'],
...     param_names=['fastw', 'sloww'],
...     output_names=['fast_ma', 'slow_ma', 'signals', 'signal_type'],
...     attr_settings=dict(
...         fast_ma=dict(dtype=float_),
...         slow_ma=dict(dtype=float_),
...         signals=dict(dtype=np.bool_),
...         signal_type=dict(dtype=SignalType),
...     ),
...     metrics=metrics,  
...     subplots=subplots
... ).with_apply_func(apply_func)

>>> cross_sig = CrossSig.run(ts, [2, 3], 4)

```

Calculate the metrics:

```
>>> cross_sig.stats(column=(2, 4, 'a'))
Start                2020-01-01 00:00:00
End                  2020-01-07 00:00:00
Period                   7 days 00:00:00
Fast Stats: count                    6.0
Fast Stats: mean                     2.0
Fast Stats: std                 0.547723
Fast Stats: min                      1.5
Fast Stats: max                      2.5
Slow Stats: count                    4.0
Slow Stats: mean                     2.0
Slow Stats: std                      0.0
Slow Stats: min                      2.0
Slow Stats: max                      2.0
Entries                                1
Exits                                  1
Name: (2, 4, a), dtype: object

```

Plot the subplots:

```
>>> cross_sig.plots(column=(2, 4, 'a')).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/indicators/plots.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/indicators/plots.dark.svg#only-dark)

We have created a smart indicator, yay! ![🥳](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f973.svg ":partying_face:")

## Extending[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/analysis/#extending "Permanent link")

Indicator classes can be extended and modified just as regular Python classes - by subclassing. Let's make the newly created functions `plot_mas` and `plot_signals` methods of the indicator class, such that we can plot both graphs separately. We will also redefine the `subplots` config to account for this change:

```
>>> class SmartCrossSig(CrossSig):
...     def plot_mas(self, column=None, add_trace_kwargs=None, fig=None):
...         ts = self.select_col_from_obj(self.ts, column).rename('TS')
...         fast_ma = self.select_col_from_obj(self.fast_ma, column).rename('Fast MA')
...         slow_ma = self.select_col_from_obj(self.slow_ma, column).rename('Slow MA')
...         fig = ts.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...         fast_ma.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...         slow_ma.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...         return fig  
...
...     def plot_signals(self, column=None, add_trace_kwargs=None, fig=None):
...         signal_type = self.select_col_from_obj(self.signal_type, column)
...         entries = (signal_type == SignalType.Entry).rename('Entries')
...         exits = (signal_type == SignalType.Exit).rename('Exits')
...         fig = entries.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...         exits.vbt.plot(add_trace_kwargs=add_trace_kwargs, fig=fig)
...         return fig
...
...     subplots = vbt.HybridConfig(  
...         mas=dict(
...             title="Moving averages",
...             plot_func='plot_mas'  
...         ),
...         signals=dict(
...             title="Signals",
...             plot_func='plot_signals'
...         )
...     )

>>> smart_cross_sig = SmartCrossSig.run(ts, [2, 3], 4)
>>> smart_cross_sig.plot_signals(column=(2, 4, 'a')).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/indicators/plot_signals.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/indicators/plot_signals.dark.svg#only-dark)

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/documentation/indicators/analysis.py.txt)