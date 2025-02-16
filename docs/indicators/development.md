---
id: development
title: Indicator Development
sidebar_label: Development
---

VectorBT PRO implements a ton of functions and arguments for seamless development of indicators. All it takes is an indicator function and a specification of how to handle it.

## Parameters[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#parameters "Permanent link")

[IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) allows definition of arbitrary parameter grids. An indicator can have one or more parameters. A parameter can have one or more values. Each value can be a scalar (such as integer), an array, or any other object.

If an indicator has multiple parameters, and one or more of them have multiple values, their values will broadcast against each other. For example, if the parameter `w1` has only one value of `2` and the parameter `w2` has two values of `3` and `4`, then `w1` will be "stretched" to two values: `2` and `2`. This way, the indicator can [zip](https://realpython.com/python-zip-function/) both parameters and create two parameter combinations: `(2, 3)` and `(2, 4)`. It will then iterate over the list of those combinations and apply a function on each one. Here's an illustration of broadcasting:

```
>>> from vectorbtpro import *

>>> def broadcast_params(*params):
...     return list(zip(*vbt.broadcast(*[vbt.to_1d_array(p) for p in params])))

>>> broadcast_params(2, 3)
[(2, 3)]

>>> broadcast_params([2, 3], 4)
[(2, 4), (3, 4)]

>>> broadcast_params(2, [3, 4])
[(2, 3), (2, 4)]

>>> broadcast_params([2, 3], [4, 5])
[(2, 4), (3, 5)]

>>> broadcast_params([2, 3], [4, 5, 6])
ValueError: Could not broadcast shapes: {0: (2,), 1: (3,)}

```

Note

You shouldn't confuse a broadcasting operation with a product operation. The product of `[2, 3]` and `[4, 5]` would yield 4 combinations: `[2, 4]`, `[2, 5]`, `[3, 4]`, and `[3, 5]`. The broadcasting operation simply stretches smaller arrays to the length of bigger arrays for zipping purposes.

To illustrate the usage of parameters in indicators, let's build a simplified indicator that returns 1 when the rolling mean is above an upper bound, -1 if it's below a lower bound, and 0 if it's between the upper and the lower bound:

```
>>> def apply_func(ts, window, lower, upper):
...     out = np.full_like(ts, np.nan, dtype=float_)
...     ts_mean = vbt.nb.rolling_mean_nb(ts, window)
...     out[ts_mean >= upper] = 1
...     out[ts_mean <= lower] = -1
...     out[(ts_mean > lower) & (ts_mean < upper)] = 0
...     return out

>>> Bounded = vbt.IF(
...     class_name="Bounded",
...     input_names=['ts'],
...     param_names=['window', 'lower', 'upper'],
...     output_names=['out']
... ).with_apply_func(apply_func)

>>> def generate_index(n):
...     return vbt.date_range("2020-01-01", periods=n)

>>> ts = pd.DataFrame({
...     'a': [5, 4, 3, 2, 3, 4, 5],
...     'b': [2, 3, 4, 5, 4, 3, 2]
... }, index=generate_index(7))
>>> bounded = Bounded.run(ts, 2, 3, 5)

```

To get the list of parameter names:

```
>>> bounded.param_names
('window', 'lower', 'upper')

```

The (broadcasted) values of each parameter can be accessed as an attribute of the indicator instance called by the parameter name plus `_list`:

```
>>> bounded.window_list
[2]

```

By default, when `per_column` is set to False, each parameter combination is applied on each column in the input. This means: if our input array has 20 columns and we want to test 5 parameter combinations, we will get `20 * 5 = 100` columns in total.

One parameter combination:

```
>>> Bounded.run(
...     ts,
...     window=2,
...     lower=3,
...     upper=5
... ).out  
bounded_window           2
bounded_lower            3
bounded_upper            5
                    a    b
2020-01-01        NaN  NaN
2020-01-02        0.0 -1.0
2020-01-03        0.0  0.0
2020-01-04       -1.0  0.0
2020-01-05       -1.0  0.0
2020-01-06        0.0  0.0
2020-01-07        0.0 -1.0

```

Multiple parameter combinations:

```
>>> Bounded.run(
...     ts,
...     window=[2, 3],
...     lower=3,
...     upper=5
... ).out  
bounded_window           2         3
bounded_lower            3         3
bounded_upper            5         5
                    a    b    a    b
2020-01-01        NaN  NaN  NaN  NaN
2020-01-02        0.0 -1.0  NaN  NaN
2020-01-03        0.0  0.0  0.0 -1.0
2020-01-04       -1.0  0.0 -1.0  0.0
2020-01-05       -1.0  0.0 -1.0  0.0
2020-01-06        0.0  0.0 -1.0  0.0
2020-01-07        0.0 -1.0  0.0 -1.0

```

Product of parameter combinations:

```
>>> Bounded.run(
...     ts,
...     window=[2, 3],
...     lower=[3, 4],
...     upper=5,
...     param_product=True
... ).out  
bounded_window                     2                   3
bounded_lower            3         4         3         4
bounded_upper            5         5         5         5
                    a    b    a    b    a    b    a    b
2020-01-01        NaN  NaN  NaN  NaN  NaN  NaN  NaN  NaN
2020-01-02        0.0 -1.0  0.0 -1.0  NaN  NaN  NaN  NaN
2020-01-03        0.0  0.0 -1.0 -1.0  0.0 -1.0 -1.0 -1.0
2020-01-04       -1.0  0.0 -1.0  0.0 -1.0  0.0 -1.0 -1.0
2020-01-05       -1.0  0.0 -1.0  0.0 -1.0  0.0 -1.0  0.0
2020-01-06        0.0  0.0 -1.0 -1.0 -1.0  0.0 -1.0 -1.0
2020-01-07        0.0 -1.0  0.0 -1.0  0.0 -1.0 -1.0 -1.0

```

More exotic parameter combinations can be created using [generate\_param\_combs](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.generate_param_combs). Since the lower bound should always remain lower than the upper bound, we can account for this relationship using [itertools.combinations](https://docs.python.org/3/library/itertools.html#itertools.combinations). After that, we can build a Cartesian product with the window using [itertools.product](https://docs.python.org/3/library/itertools.html#itertools.product).

```
>>> bound_combs_op = (combinations, [3, 4, 5], 2)
>>> product_op = (product, [2, 3], bound_combs_op)
>>> windows, lowers, uppers = vbt.generate_param_combs(product_op)  

>>> Bounded.run(
...     ts,
...     window=windows,
...     lower=lowers,
...     upper=uppers
... ).out  
bounded_window                               2                             3
bounded_lower                      3         4                   3         4
bounded_upper            4         5         5         4         5         5
                    a    b    a    b    a    b    a    b    a    b    a    b
2020-01-01        NaN  NaN  NaN  NaN  NaN  NaN  NaN  NaN  NaN  NaN  NaN  NaN
2020-01-02        1.0 -1.0  0.0 -1.0  0.0 -1.0  NaN  NaN  NaN  NaN  NaN  NaN
2020-01-03        0.0  0.0  0.0  0.0 -1.0 -1.0  1.0 -1.0  0.0 -1.0 -1.0 -1.0
2020-01-04       -1.0  1.0 -1.0  0.0 -1.0  0.0 -1.0  1.0 -1.0  0.0 -1.0 -1.0
2020-01-05       -1.0  1.0 -1.0  0.0 -1.0  0.0 -1.0  1.0 -1.0  0.0 -1.0  0.0
2020-01-06        0.0  0.0  0.0  0.0 -1.0 -1.0 -1.0  1.0 -1.0  0.0 -1.0 -1.0
2020-01-07        1.0 -1.0  0.0 -1.0  0.0 -1.0  1.0 -1.0  0.0 -1.0 -1.0 -1.0

```

One parameter combination per column:

```
>>> Bounded.run(
...     ts,
...     window=[2, 3],
...     lower=[3, 4],
...     upper=5,
...     per_column=True
... ).out  
bounded_window      2    3
bounded_lower       3    4
bounded_upper       5    5
                    a    b
2020-01-01        NaN  NaN
2020-01-02        0.0  NaN
2020-01-03        0.0 -1.0
2020-01-04       -1.0 -1.0
2020-01-05       -1.0  0.0
2020-01-06        0.0 -1.0
2020-01-07        0.0 -1.0

```

### Defaults[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#defaults "Permanent link")

Any argument passed to [IndicatorFactory.with\_custom\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_custom_func) that isn't listed among the arguments of [IndicatorBase.run\_pipeline](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.run_pipeline) is meant to be used as a default argument for the calculation function. Since most methods, including [IndicatorFactory.with\_apply\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_apply_func), call this method, we can easily define parameter defaults by passing them along with the function:

```
>>> Bounded = vbt.IF(
...     class_name="Bounded",
...     input_names=['ts'],
...     param_names=['window', 'lower', 'upper'],
...     output_names=['out']
... ).with_apply_func(apply_func, window=2, lower=3, upper=4)

>>> Bounded.run(ts).out
              a    b
2020-01-01  NaN  NaN
2020-01-02  1.0 -1.0
2020-01-03  0.0  0.0
2020-01-04 -1.0  1.0
2020-01-05 -1.0  1.0
2020-01-06  0.0  0.0
2020-01-07  1.0 -1.0

>>> Bounded.run(ts, upper=[5, 6]).out
bounded_upper           5         6
                   a    b    a    b
2020-01-01       NaN  NaN  NaN  NaN
2020-01-02       0.0 -1.0  0.0 -1.0
2020-01-03       0.0  0.0  0.0  0.0
2020-01-04      -1.0  0.0 -1.0  0.0
2020-01-05      -1.0  0.0 -1.0  0.0
2020-01-06       0.0  0.0  0.0  0.0
2020-01-07       0.0 -1.0  0.0 -1.0

```

The reason why the parameters `window` and `lower` do not appear in the column hierarchy above is because default values are hidden by default. To uncover them, disable `hide_default`:

```
>>> Bounded.run(ts, hide_default=False).out
bounded_window           2     
bounded_lower            3     
bounded_upper            4     
                    a    b
2020-01-01        NaN  NaN
2020-01-02        1.0 -1.0
2020-01-03        0.0  0.0
2020-01-04       -1.0  1.0
2020-01-05       -1.0  1.0
2020-01-06        0.0  0.0
2020-01-07        1.0 -1.0

```

### Array-like[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#array-like "Permanent link")

Some parameters are meant to be defined per row, column, or element of the input. By default, if we pass the parameter value as an array, the indicator will treat this array as a list of multiple values - one per input. To make the indicator view this array as a single value, we need to set the flag `is_array_like` to True in `param_settings`. Also, to automatically broadcast the parameter value to the input shape, set `bc_to_input` to True, 0 (index axis), or 1 (column axis).

In our example, the parameter `window` can broadcast per column, and both parameters `lower` and `upper` can broadcast per element. But to make all of this work, we need to rewrite the `apply_func` to apply the rolling mean on each column instead of the entire input:

```
>>> def apply_func(ts, window, lower, upper):  
...     out = np.full_like(ts, np.nan, dtype=float_)
...     ts_means = []
...     for col in range(ts.shape[1]):
...         ts_means.append(vbt.nb.rolling_mean_1d_nb(ts[:, col], window[col]))
...     ts_mean = np.column_stack(ts_means)
...     out[ts_mean >= upper] = 1
...     out[ts_mean <= lower] = -1
...     out[(ts_mean > lower) & (ts_mean < upper)] = 0
...     return out

>>> Bounded = vbt.IF(
...     class_name="Bounded",
...     input_names=['ts'],
...     param_names=['window', 'lower', 'upper'],
...     output_names=['out']
... ).with_apply_func(
...     apply_func,
...     param_settings=dict(
...         window=dict(is_array_like=True, bc_to_input=1, per_column=True),
...         lower=dict(is_array_like=True, bc_to_input=True),
...         upper=dict(is_array_like=True, bc_to_input=True)
...     )
... )

```

Both bound parameters can now be passed as a scalar (value per whole input), a one-dimensional array (value per row or column, depending upon whether input is a Series or a DataFrame), a two-dimensional array (value per element), or a list of any of those. This allows for the highest parameter flexibility.

For example, let's build a grid of two parameter combinations:

```
>>> Bounded.run(
...     ts,
...     window=[np.array([2, 3]), 4],  
...     lower=np.array([[1, 2]]),  
...     upper=np.array([6, 5, 4, 3, 4, 5, 6]),  
... ).out
bounded_window         2       3               4
bounded_lower    array_0 array_0 array_1 array_1  
bounded_upper    array_0 array_0 array_1 array_1
                       a       b       a       b
2020-01-01           NaN     NaN     NaN     NaN
2020-01-02           0.0     NaN     NaN     NaN
2020-01-03           0.0     0.0     NaN     NaN
2020-01-04           0.0     1.0     1.0     1.0
2020-01-05           0.0     1.0     0.0     1.0
2020-01-06           0.0     0.0     0.0     0.0
2020-01-07           0.0     0.0     0.0     0.0

```

Our `apply_func` gets called twice, one for each parameter combination in `window`. If you print the shapes of the passed arguments, you will see that each window array now matches the number of columns in `ts`, while each bound array exactly matches the shape of `ts`:

```
Combination 1:
(7, 2)
(2,)
(7, 2)
(7, 2)

Combination 2:
(7, 2)
(2,)
(7, 2)
(7, 2)

```

### Lazy broadcasting[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#lazy-broadcasting "Permanent link")

Broadcasting a huge number of parameters to the input shape can consume lots of memory, especially when the arrays materialize. Luckily, vectorbt can preserve the original (small) dimensions of each parameter array and give us all the power over its broadcasting. This requires setting `keep_flex` to True in `broadcast_kwargs`, which will make the factory first check whether the array can broadcast, and then expand it to either one or two dimensions in the most memory-efficient way. There are two configs in [configs](https://vectorbt.pro/pvt_40509f46/api/indicators/configs) exactly for this purpose: one for column-wise broadcasting and one for element-wise broadcasting.

```
>>> def apply_func(ts, window, lower, upper):
...     window = np.broadcast_to(window, ts.shape[1])  
...     lower = np.broadcast_to(lower, ts.shape)
...     upper = np.broadcast_to(upper, ts.shape)
... 
...     out = np.full_like(ts, np.nan, dtype=float_)
...     ts_means = []
...     for col in range(ts.shape[1]):
...         ts_means.append(vbt.nb.rolling_mean_1d_nb(ts[:, col], window[col]))
...     ts_mean = np.column_stack(ts_means)
...     out[ts_mean >= upper] = 1
...     out[ts_mean <= lower] = -1
...     out[(ts_mean > lower) & (ts_mean < upper)] = 0
...     return out

>>> Bounded = vbt.IF(
...     class_name="Bounded",
...     input_names=['ts'],
...     param_names=['window', 'lower', 'upper'],
...     output_names=['out']
... ).with_apply_func(
...     apply_func,
...     param_settings=dict(
...         window=vbt.flex_col_param_config,
...         lower=vbt.flex_elem_param_config,
...         upper=vbt.flex_elem_param_config
...     )
... )

```

Well done! This is the most flexible and the least memory consuming indicator implementation. Instead of broadcasting all array-like parameter values right away, we postpone the operation to the point in time when this is actually needed.

#### With Numba[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#with-numba "Permanent link")

The implementation above is great but not the most optimized one since it iterates over the input shape multiple times. As a bonus, let's rewrite our `apply_func` to be Numba-compiled: it will iterate over columns and rows, select each parameter value [flexibly](https://vectorbt.pro/pvt_40509f46/documentation/fundamentals/#flexible-indexing) and entirely without broadcasting, and gradually fill the output array.

```
>>> @njit
... def apply_func_nb(ts, window, lower, upper):
...     out = np.full_like(ts, np.nan, dtype=float_)
...
...     for col in range(ts.shape[1]):
...         _window = vbt.flex_select_1d_pc_nb(window, col)  
...
...         for row in range(ts.shape[0]):
...             window_start = max(0, row + 1 - _window)
...             window_end = row + 1
...             if window_end - window_start >= _window:
...                 _lower = vbt.flex_select_nb(lower, row, col)  
...                 _upper = vbt.flex_select_nb(upper, row, col)  
...
...                 mean = np.nanmean(ts[window_start:window_end, col])  
...                 if mean >= _upper:
...                     out[row, col] = 1
...                 elif mean <= _lower:
...                     out[row, col] = -1
...                 elif _lower < mean < _upper:
...                     out[row, col] = 0
...     return out

```

Hint

This is a perfectly valid Python code - even if you remove the `@njit` decorator, it would still work!

Remember that executing a code jitted with Numba may provide performance that is magnitudes higher than that offered by Python and even Pandas ![🐌](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f40c.svg ":snail:")

### Parameterless[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#parameterless "Permanent link")

Indicators can also be parameterless, such as [OBV](https://vectorbt.pro/pvt_40509f46/api/indicators/custom/obv/#vectorbtpro.indicators.custom.obv.OBV).

## Inputs[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#inputs "Permanent link")

[IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) supports passing none, one, or multiple inputs. If multiple inputs were passed, it tries to broadcast them into a single shape with [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast) (see [Broadcasting](https://vectorbt.pro/pvt_40509f46/documentation/fundamentals/#broadcasting)).

Remember that in vectorbt each column means a separate backtest. That's why in order to use multiple pieces of information, such as OHLCV, we need to provide them as separate Pandas objects rather than a monolithic DataFrame (see [Multidimensionality](https://vectorbt.pro/pvt_40509f46/documentation/fundamentals/#multidimensionality)).

Let's create a parameterless indicator that measures the position of the closing price relative to the candle:

```
>>> def apply_func(high, low, close):
...     return (close - low) / (high - low)

>>> RelClose = vbt.IF(
...     input_names=['high', 'low', 'close'],
...     output_names=['out']
... ).with_apply_func(apply_func)

>>> close = pd.Series([1, 2, 3, 4, 5], index=generate_index(5))
>>> high = close * 1.2
>>> low = close * 0.8

>>> rel_close = RelClose.run(high, low, close)
>>> rel_close.out
2020-01-01    0.5
2020-01-02    0.5
2020-01-03    0.5
2020-01-04    0.5
2020-01-05    0.5
dtype: float64

```

To get the list of input names:

```
>>> rel_close.input_names
('high', 'low', 'close')

```

Any (broadcasted and tiled) input array can be accessed as an attribute of the indicator instance:

```
>>> rel_close.high
2020-01-01    1.2
2020-01-02    2.4
2020-01-03    3.6
2020-01-04    4.8
2020-01-05    6.0
dtype: float64

```

Note

The input array attached to the indicator instance may not look the same as the input passed to the indicator: 1) it was broadcasted with another inputs, and 2) upon accessing the attribute, it gets automatically tiled by the number of parameter combinations to compare it more easily with outputs. To access the original array, prepend an underscore (`_high`).

To demonstrate broadcasting, let's pass `high` as a scalar, `low` as a Series, and `close` as a DataFrame (even if it doesn't make sense):

```
>>> high = 10
>>> low = pd.Series([1, 2, 3, 4, 5], index=generate_index(5))
>>> close = pd.DataFrame({
...     'a': [3, 2, 1, 2, 3],
...     'b': [5, 4, 3, 4, 5]
... }, index=generate_index(5))
>>> RelClose.run(high, low, close).out
                   a         b
2020-01-01  0.222222  0.444444
2020-01-02  0.000000  0.250000
2020-01-03 -0.285714  0.000000
2020-01-04 -0.333333  0.000000
2020-01-05 -0.400000  0.000000

```

Hint

By default, if all inputs are Series, they are automatically expanded into two-dimensional NumPy arrays. This is done to provide a single array interface since most vectorbt functions primarily work on two-dimensional data. To keep their original dimensions, set `to_2d` to False in [IndicatorFactory.with\_apply\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_apply_func) or any other factory method.

To change any broadcasting rule, we can pass a dict called `broadcast_kwargs`, which gets unfolded and forwarded down to [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast). For example, let's instruct the broadcaster to cast all three arrays into `np.float16`:

```
>>> RelClose.run(
...     high, low, close,
...     broadcast_kwargs=dict(require_kwargs=dict(dtype=np.float16))
... ).out.dtypes
a    float16
b    float16
dtype: object

```

Hint

Remember that any additional keyword arguments passed to a `run` method are forwarded down to [IndicatorBase.run\_pipeline](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.run_pipeline). Thus, we can set up the pipeline during both the creation of the indicator and its execution.

Since all arrays are directly passed to [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast), another possibility is to wrap any of them using a special class [BCO](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.BCO) to override the broadcasting rules just for this particular array:

```
>>> RelClose.run(
...     vbt.BCO(high, require_kwargs=dict(dtype=np.float16)), 
...     vbt.BCO(low, require_kwargs=dict(dtype=np.float16)), 
...     vbt.BCO(close, require_kwargs=dict(dtype=np.float16))
... ).out.dtypes
a    float16
b    float16
dtype: object

```

### One dim[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#one-dim "Permanent link")

Not always we can (easily) adopt our indicator function to work on two-dimensional data. For instance, to make use of a TA-Lib indicator in `apply_func`, we can pass to it only one column at a time. To instruct [IndicatorFactory.with\_apply\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_apply_func) to split any input and in-output (Pandas or NumPy) array by column, we can use the `takes_1d` argument:

```
>>> import talib

>>> def apply_func_1d(close, timeperiod):
...     return talib.SMA(close.astype(np.double), timeperiod)

>>> SMA = vbt.IF(
...     input_names=['ts'],
...     param_names=['timeperiod'],
...     output_names=['sma']
... ).with_apply_func(apply_func_1d, takes_1d=True)

>>> sma = SMA.run(ts, [3, 4])
>>> sma.sma
custom_timeperiod                   3         4
                          a         b    a    b
2020-01-01              NaN       NaN  NaN  NaN
2020-01-02              NaN       NaN  NaN  NaN
2020-01-03         4.000000  3.000000  NaN  NaN
2020-01-04         3.000000  4.000000  3.5  3.5
2020-01-05         2.666667  4.333333  3.0  4.0
2020-01-06         3.000000  4.000000  3.0  4.0
2020-01-07         4.000000  3.000000  3.5  3.5

```

Note

Not to be confused with `per_column`, which also splits by column but applies one parameter combination on one column instead of all columns.

### Defaults[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#defaults_1 "Permanent link")

Similar to parameters, we can also define defaults for inputs:

```
>>> RelClose = vbt.IF(
...     input_names=['high', 'low', 'close'],
...     output_names=['out']
... ).with_apply_func(
...     apply_func,
...     high=0,
...     low=10
... )

>>> RelClose.run(close).out
              a    b
2020-01-01  0.7  0.5
2020-01-02  0.8  0.6
2020-01-03  0.9  0.7
2020-01-04  0.8  0.6
2020-01-05  0.7  0.5

```

But in contrast to parameters, setting inputs to scalars is often not the best idea. Rather, we want to be able to set them to other inputs, which is possible using [Ref](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.Ref):

```
>>> RelClose = vbt.IF(
...     input_names=['high', 'low', 'close'],
...     output_names=['out']
... ).with_apply_func(
...     apply_func,
...     high=vbt.Ref('close'),
...     low=vbt.Ref('close')
... )

>>> RelClose.run(high=high, close=close).out
              a    b
2020-01-01  0.0  0.0
2020-01-02  0.0  0.0
2020-01-03  0.0  0.0
2020-01-04  0.0  0.0
2020-01-05  0.0  0.0

```

### Using Pandas[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#using-pandas "Permanent link")

Not always working solely with NumPy arrays is the best approach: sometimes we want to take advantage of the metadata, Pandas, or vectorbt's Pandas extensions. To avoid conversion of Pandas objects to NumPy arrays, we can set `keep_pd` to True.

As an example, let's create an indicator that takes a DataFrame and normalizes it against the mean of each group of columns. The most interesting part of this: the `group_by` for grouping columns will become a parameter!

```
>>> def apply_func(ts, group_by):
...     return ts.vbt.demean(group_by=group_by)

>>> Demeaner = vbt.IF(
...     input_names=['ts'],
...     param_names=['group_by'],
...     output_names=['out']
... ).with_apply_func(apply_func, keep_pd=True)

>>> ts_wide = pd.DataFrame({
...     'a': [1, 2, 3, 4, 5],
...     'b': [5, 4, 3, 2, 1],
...     'c': [3, 2, 1, 2, 3],
...     'd': [1, 2, 3, 2, 1]
... }, index=generate_index(5))
>>> demeaner = Demeaner.run(ts_wide, group_by=[(0, 0, 1, 1), True])
>>> demeaner.out
custom_group_by                tuple_0                True
                      a    b    c    d    a    b    c    d
2020-01-01         -2.0  2.0  1.0 -1.0 -1.5  2.5  0.5 -1.5
2020-01-02         -1.0  1.0  0.0  0.0 -0.5  1.5 -0.5 -0.5
2020-01-03          0.0  0.0 -1.0  1.0  0.5  0.5 -1.5  0.5
2020-01-04          1.0 -1.0  0.0  0.0  1.5 -0.5 -0.5 -0.5
2020-01-05          2.0 -2.0  1.0 -1.0  2.5 -1.5  0.5 -1.5

```

Instead of working on Pandas objects, we can instruct [IndicatorBase.run\_pipeline](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.run_pipeline) to pass inputs as NumPy arrays along with a [wrapper](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#wrapping) containing the Pandas metadata:

```
>>> def apply_func(ts, group_by, wrapper):  
...     group_map = wrapper.grouper.get_group_map(group_by=group_by)
...     return vbt.nb.demean_nb(ts, group_map)

>>> Demeaner = vbt.IF(
...     input_names=['ts'],
...     param_names=['group_by'],
...     output_names=['out']
... ).with_apply_func(apply_func, pass_wrapper=True)

```

### Inputless[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#inputless "Permanent link")

What if an indicator doesn't take any input arrays? For instance, we may want to create an indicator that takes an input shape, creates one or more output arrays of this shape, and fills them using information supplied as additional arguments. For this, we can force the user to provide an input shape using `require_input_shape`.

Let's define a generator that emulates random returns and generates a synthetic price, which is a parametrized way of implementing [RandomData](https://vectorbt.pro/pvt_40509f46/api/data/custom/random/#vectorbtpro.data.custom.random.RandomData):

```
>>> def apply_func(input_shape, start, mean, std):
...     rand_returns = np.random.normal(mean, std, input_shape)
...     return start * np.cumprod(1 + rand_returns, axis=0)

>>> RandPrice = vbt.IF(
...     class_name="RandPrice",
...     param_names=['start', 'mean', 'std'],
...     output_names=['out']
... ).with_apply_func(
...     apply_func,
...     require_input_shape=True,
...     start=100,  
...     mean=0,  
...     std=0.01,  
...     seed=42  
... )

>>> RandPrice.run((5, 2)).out
            0           1
0  100.496714   99.861736
1  101.147620  101.382660
2  100.910779  101.145285
3  102.504375  101.921510
4  102.023143  102.474495

```

Info

Whenever `require_input_shape` is True, [IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) prepends an `input_shape` argument to the `run` method's signature. Without this argument, the `apply_func` itself must decide on the input shape.

But as you see, having integer columns and index is not quite convenient. Gladly, vectorbt allows us to pass `input_index` and `input_columns`!

```
>>> RandPrice.run(
...     (5, 2),
...     input_index=generate_index(5), 
...     input_columns=['a', 'b'],
...     mean=[-0.1, 0.1]
... ).out
randprice_mean                  -0.1                     0.1
                        a          b           a           b
2020-01-01      90.496714  89.861736  109.536582  109.534270
2020-01-02      82.033180  82.244183  120.755278  118.392000
2020-01-03      73.637778  73.827201  130.747876  129.565496
2020-01-04      67.436898  67.011056  142.498409  142.929202
2020-01-05      60.376609  60.673526  155.454330  155.203528

```

One can even build an indicator that decides on the output shape dynamically. Let's create a crazy indicator that spits out an array with a random shape:

```
>>> def custom_func(min_rows=1, max_rows=5, min_cols=1, max_cols=3):  
...     n_rows = np.random.randint(min_rows, max_rows)
...     n_cols = np.random.randint(min_cols, max_cols)
...     return np.random.uniform(size=(n_rows, n_cols))

>>> RandShaped = vbt.IF(
...     output_names=['out']
... ).with_custom_func(custom_func)

>>> RandShaped.run(seed=42).out
          0         1
0  0.950714  0.731994
1  0.598658  0.156019
2  0.155995  0.058084

>>> RandShaped.run(seed=43).out
0    0.609067
dtype: float64

>>> RandShaped.run(seed=44).out
          0        1
0  0.104796  0.74464

```

## Outputs[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#outputs "Permanent link")

[IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) supports returning one or multiple outputs. There are two types of outputs: regular and in-place outputs (also called "in-outputs").

### Regular[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#regular "Permanent link")

Regular outputs are arrays explicitly returned by the calculation function. Each output must have an exact same shape and match the number of columns in the input shape multiplied by the number of parameter combinations (we should only take care of this requirement when using `custom_func`, while `apply_func` does the tiling job for us). If there is only one output, an array must be returned. If there are multiple outputs, a tuple of multiple arrays must be returned.

Let's demonstrate multiple regular outputs by computing and returning the entries and the exits from a moving average crossover:

```
>>> def apply_func(ts, fastw, sloww, minp=None):
...     fast_ma = vbt.nb.rolling_mean_nb(ts, fastw, minp=minp)
...     slow_ma = vbt.nb.rolling_mean_nb(ts, sloww, minp=minp)
...     entries = vbt.nb.crossed_above_nb(fast_ma, slow_ma)
...     exits = vbt.nb.crossed_above_nb(slow_ma, fast_ma)
...     return (fast_ma, slow_ma, entries, exits)  

>>> CrossSig = vbt.IF(
...     class_name="CrossSig",
...     input_names=['ts'],
...     param_names=['fastw', 'sloww'],
...     output_names=['fast_ma', 'slow_ma', 'entries', 'exits']
... ).with_apply_func(apply_func)

>>> ts2 = pd.DataFrame({
...     'a': [1, 2, 3, 2, 1, 2, 3],
...     'b': [3, 2, 1, 2, 3, 2, 1]
... }, index=generate_index(7))
>>> cross_sig = CrossSig.run(ts2, 2, 4)

```

Important

Any output registered in `output_names` must be of the same shape as the broadcasted inputs. This requirement makes possible indexing the indicator instance.

To get the list of output names:

```
>>> cross_sig.output_names
('fast_ma', 'slow_ma', 'entries', 'exits')

```

Any (broadcasted and tiled) output array can be accessed as an attribute of the indicator instance:

```
>>> cross_sig.entries
crosssig_fastw      2      2
crosssig_sloww      4      4
                    a      b
2020-01-01      False  False
2020-01-02      False  False
2020-01-03      False  False
2020-01-04      False  False
2020-01-05      False   True
2020-01-06      False  False
2020-01-07       True  False

```

### In-place[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#in-place "Permanent link")

In-place outputs are arrays that are not returned but modified in-place. They act as regular inputs when entering the pipeline and as regular outputs when exiting it. In particular:

1.  They broadcast together with regular inputs if provided, otherwise an empty array is created
2.  They get tiled by the number of hyperparameter combinations
3.  Each tile gets modified in-place (**not** returned)
4.  After calculation, all the tiles get concatenated to form an output

By default, in-place outputs are created as empty arrays with uninitialized floating values. This allows creation of optional outputs that, if not written, do not occupy much memory. Since not all outputs are meant to be of data type `float`, we can pass `dtype` in the `in_output_settings`.

Let's modify the indicator above by converting both signal arrays to in-outputs:

```
>>> def apply_func(ts, entries, exits, fastw, sloww, minp=None):
...     fast_ma = vbt.nb.rolling_mean_nb(ts, fastw, minp=minp)
...     slow_ma = vbt.nb.rolling_mean_nb(ts, sloww, minp=minp)
...     entries[:] = vbt.nb.crossed_above_nb(fast_ma, slow_ma)  
...     exits[:] = vbt.nb.crossed_above_nb(slow_ma, fast_ma)
...     return (fast_ma, slow_ma)  

>>> CrossSig = vbt.IF(
...     class_name="CrossSig",
...     input_names=['ts'],
...     in_output_names=['entries', 'exits'],
...     param_names=['fastw', 'sloww'],
...     output_names=['fast_ma', 'slow_ma']
... ).with_apply_func(
...     apply_func,
...     in_output_settings=dict(
...         entries=dict(dtype=np.bool_),  
...         exits=dict(dtype=np.bool_)
...     )
... )
>>> cross_sig = CrossSig.run(ts2, 2, 4)

```

If we print the `output_names`, we will notice that `entries` and `exits` are not there anymore:

```
>>> cross_sig.output_names
('fast_ma', 'slow_ma')

```

To see all in-output arrays, we need to query the `in_output_names` attribute instead:

```
>>> cross_sig.in_output_names
('entries', 'exits')

```

Both signal arrays can be accessed as usual:

```
>>> cross_sig.entries
crosssig_fastw             2
crosssig_sloww             4
                    a      b
2020-01-01      False  False
2020-01-02      False  False
2020-01-03      False  False
2020-01-04      False  False
2020-01-05      False   True
2020-01-06      False  False
2020-01-07       True  False

```

Hint

An interesting scenario emerges when there are no regular outputs, only in-outputs. In such case, you should set `output_names` to an empty list, modify all arrays in-place, and return `None`. See the example below.

#### Defaults[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#defaults_2 "Permanent link")

You may ask: _"Why should we bother using in-outputs when we can just return regular outputs?"_ Because we can provide custom data and overwrite it without consuming additional memory. Consider the following example where we keep the first `n` signals in a boolean time series:

```
>>> @njit
... def apply_func_nb(signals, n):
...     for col in range(signals.shape[1]):
...         n_found = 0
...         for row in range(signals.shape[0]):
...             if signals[row, col]:
...                 if n_found >= n:
...                     signals[row, col] = False
...                 else:
...                     n_found += 1

>>> FirstNSig = vbt.IF(
...     class_name="FirstNSig",
...     in_output_names=['signals'],
...     param_names=['n']
... ).with_apply_func(apply_func_nb)

>>> signals = pd.Series([False, True, True, True, False])
>>> first_n_sig = FirstNSig.run([1, 2, 3], signals=signals)
>>> first_n_sig.signals
firstnsig_n      1      2      3
0            False  False  False
1             True   True   True
2            False   True   True
3            False  False   True
4            False  False  False

```

As you see, one array did the job of two, and this without touching the passed `signals` array!

```
>>> signals
0    False
1     True
2     True
3     True
4    False
dtype: bool

```

Note

In contrast to regular inputs, none of the in-outputs is required when running an indicator, thus they appear in the signature of the `run` method as keyword arguments with `None` as default. Make sure to pass each in-output as a keyword argument after other positional arguments (such as inputs and parameters).

Any additional output returned by `custom_func` that is not registered in `output_names` is returned in a raw format along with the indicator instance. Such outputs can include objects of any type, especially arrays that have a shape different from that of the inputs. They are not included in the indicator instance simply because the indicator factory doesn't know how to wrap, index, and analyze them, only the user knows. For example, let's return the rolling mean along with its maximum in each column:

```
>>> def custom_func(ts, window):  
...     ts_mas = []
...     ts_ma_maxs = []
...     for w in window:
...         ts_ma = vbt.nb.rolling_mean_nb(ts, w)
...         ts_mas.append(ts_ma)
...         ts_ma_maxs.append(np.nanmax(ts_ma, axis=0))
...     return np.column_stack(ts_mas), np.concatenate(ts_ma_maxs)

>>> MAMax = vbt.IF(
...     class_name='MAMax',
...     input_names=['ts'],
...     param_names=['window'],
...     output_names=['ma'],
... ).with_custom_func(custom_func)

>>> ma_ind, ma_max = MAMax.run(ts2, [2, 3])  
>>> ma_ind
mamax_window         2                   3
                a    b         a         b
2020-01-01    NaN  NaN       NaN       NaN
2020-01-02    1.5  2.5       NaN       NaN
2020-01-03    2.5  1.5  2.000000  2.000000
2020-01-04    2.5  1.5  2.333333  1.666667
2020-01-05    1.5  2.5  2.000000  2.000000
2020-01-06    1.5  2.5  1.666667  2.333333
2020-01-07    2.5  1.5  2.000000  2.000000

>>> ma_ind.wrapper.wrap_reduced(ma_max)  
mamax_window   
2             a    2.500000
              b    2.500000
3             a    2.333333
              b    2.333333
dtype: float64

```

### Lazy[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#lazy "Permanent link")

Use `lazy_outputs` argument when constructing an indicator to define lazy outputs - outputs that are computed from "normal" outputs and when explicitly requested. They are available as regular cacheable properties of the indicator instance and can have an arbitrary type. Continuing with the previous example, let's attach a cached property that returns the maximum of the rolling mean:

```
>>> MAMax = vbt.IF(
...     class_name='MAMax',
...     input_names=['ts'],
...     param_names=['window'],
...     output_names=['ma'],
...     lazy_outputs=dict(
...         ma_max=vbt.cached_property(lambda self: self.ma.max())
...     )
... ).with_apply_func(vbt.nb.rolling_mean_nb)

>>> ma_ind = MAMax.run(ts2, [2, 3])
>>> ma_ind.ma_max
mamax_window   
2             a    2.500000
              b    2.500000
3             a    2.333333
              b    2.333333
dtype: float64

```

Hint

You can achieve the same result by subclassing `MAMax` and defining the property in the subclass.

## Custom arguments[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#custom-arguments "Permanent link")

Sometimes, we need to pass arguments that act neither as inputs, in-outputs, or parameters.

### Optional[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#optional "Permanent link")

If you look at `apply_func` of `CrossSig`, we take another optional argument `minp`, which regulates the minimal number of observations in a window required to have a value - listing a keyword argument with its default in `custom_func` or `apply_func` is the first way to provide a default value. Another way is to make the argument positional and to provide its default to [IndicatorFactory.with\_custom\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_custom_func) or any other factory method. The default can also be set during the execution in the `run` method.

### Variable[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#variable "Permanent link")

Variable arguments, mostly appearing as `*args`, are used to take a _variable_ number of arguments. To enable variable arguments, we need to set `var_args` to True. The reason for this is the following: when [IndicatorFactory.with\_custom\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_custom_func) builds the `run` method, it needs to reorganize the arguments such that required arguments come before optional arguments. Without the `var_args` flag, the `run` method doesn't expect any additional positional arguments to be passed, which either leads to an error or, more badly, a corrupted result.

Let's add a variable number of inputs:

```
>>> def custom_func(*arrs):
...     out = None
...     for arr in arrs:
...         if out is None:
...             out = arr
...         else:
...             out += arr
...     return out

>>> VarArgAdder = vbt.IF(
...     output_names=['out']  
... ).with_custom_func(custom_func, var_args=True)

>>> VarArgAdder.run(
...     pd.Series([1, 2, 3]),
...     pd.Series([10, 20, 30]),
...     pd.Series([100, 200, 300])
... ).out
0    111
1    222
2    333
dtype: int64

```

Note

The indicator above is effectively inputless: inputs that are not registered in `input_names` won't broadcast automatically and are not available as attributes of an indicator instance.

### Positional[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#positional "Permanent link")

Positional arguments are treated like variable arguments.

### Keyword-only[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#keyword-only "Permanent link")

We can set `keyword_only_args` to True to force ourselves to use any argument as a keyword-only argument, for instance, to avoid accidentaly misplacing arguments. Take the `RelClose` indicator as an example:

```
>>> def apply_func(high, low, close):
...     return (close - low) / (high - low)

>>> RelClose = vbt.IF(
...     input_names=['high', 'low', 'close'],
...     output_names=['out']
... ).with_apply_func(apply_func)

>>> RelClose.run(close, high, low).out  
                   a         b
2020-01-01  1.285714  1.800000
2020-01-02  1.000000  1.333333
2020-01-03  0.777778  1.000000
2020-01-04  0.750000  1.000000
2020-01-05  0.714286  1.000000

>>> RelClose = vbt.IF(
...     input_names=['high', 'low', 'close'],
...     output_names=['out']
... ).with_apply_func(apply_func, keyword_only_args=True)

>>> RelClose.run(close, high, low).out  
TypeError: run() takes 1 positional argument but 4 were given

>>> RelClose.run(close=close, high=high, low=low).out  
                   a         b
2020-01-01  0.222222  0.444444
2020-01-02  0.000000  0.250000
2020-01-03 -0.285714  0.000000
2020-01-04 -0.333333  0.000000
2020-01-05 -0.400000  0.000000

```

## Built-in caching[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#built-in-caching "Permanent link")

[IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) re-uses calculation artifacts whenever possible. Since it was originally designed for hyperparameter optimization and there are times when parameter combinations get repeated, prevention of processing the same parameter combination over and over again is inevitable for good performance.

First, let's take a look at a typical raw output by passing repeating parameter combinations and setting `return_raw` to True:

```
>>> raw = vbt.MA.run(
...     ts2, 
...     window=[2, 2, 3], 
...     wtype=["simple", "simple", "exp"],  
...     return_raw=True)
>>> raw
([array([[     nan,      nan,      nan,      nan,      nan,      nan],
         [1.5     , 2.5     , 1.5     , 2.5     ,      nan,      nan],
         [2.5     , 1.5     , 2.5     , 1.5     , 2.25    , 1.75    ],
         [2.5     , 1.5     , 2.5     , 1.5     , 2.125   , 1.875   ],
         [1.5     , 2.5     , 1.5     , 2.5     , 1.5625  , 2.4375  ],
         [1.5     , 2.5     , 1.5     , 2.5     , 1.78125 , 2.21875 ],
         [2.5     , 1.5     , 2.5     , 1.5     , 2.390625, 1.609375]])],
 [(2, 0), (2, 0), (3, 2)],
 2,
 [])

```

The raw output consists of

1.  the list of returned output arrays,
2.  the list of zipped parameter combinations,
3.  the number of input columns, and
4.  other objects returned along with output arrays but not listed in `output_names`.

Info

A raw output represents the context of running an indicator. If any parameter combination appears in the list of zipped parameter combinations, it means that it was actually run, not cached.

We see that our calculation function was executed for the same parameter combination twice. There is nothing wrong with this if our calculation is fast enough for us to not care about re-running the same calculation procedure. But what if our indicator was very complex and slow to compute? In such case, we can instruct [IndicatorBase.run\_pipeline](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.run_pipeline) to run the indicator on unique parameter combinations only by passing `run_unique`:

```
>>> raw = vbt.MA.run(
...     ts2, 
...     window=[2, 2, 3], 
...     wtype=["simple", "simple", "exp"], 
...     return_raw=True, 
...     run_unique=True, 
...     silence_warnings=True)  
>>> raw
([array([[     nan,      nan,      nan,      nan],
         [1.5     , 2.5     ,      nan,      nan],
         [2.5     , 1.5     , 2.25    , 1.75    ],
         [2.5     , 1.5     , 2.125   , 1.875   ],
         [1.5     , 2.5     , 1.5625  , 2.4375  ],
         [1.5     , 2.5     , 1.78125 , 2.21875 ],
         [2.5     , 1.5     , 2.390625, 1.609375]])],
 [(2, 0), (3, 2)],
 2,
 [])

```

Let's compare the performance of repeatedly running the same parameter combination with and without `run_unique`:

```
>>> a = np.random.uniform(size=(1000,))

>>> %timeit vbt.MA.run(a, np.full(1000, 2), run_unique=False)
11.6 ms ± 1.26 ms per loop (mean ± std. dev. of 7 runs, 100 loops each)

>>> %timeit vbt.MA.run(a, np.full(1000, 2), run_unique=True)
5.91 ms ± 220 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)

```

Hint

Moving average is among the fastest indicators out there. Try this example on a more complex indicator to get a feeling of how important the built-in caching is!

As a rule of thumb:

-   Enable `run_unique` if input arrays have few columns, the calculation function is rather slow, and there are duplicates among parameter combinations
-   Disable `run_unique` if input arrays have many columns, the calculation function is very fast, or if two identical parameter combinations can lead to different results (for example, when using `custom_func` that does some decision based on the whole parameter grid, or when there is some randomness involved)

Note

`run_unique` is disabled by default.

### Reusing cache[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#reusing-cache "Permanent link")

Internally, `run_unique` uses the raw output computed from the unique parameter combinations to produce the output for all parameter combinations. But what if we had our own raw output? We can pass it as `use_raw`! This won't call the calculation function but simply stack raw outputs in the way their parameter combinations appear in the requested grid. If some requested parameter combinations cannot be found in `use_raw`, it will throw an error:

```
>>> raw = vbt.MA.run(
...     ts2, 
...     window=[2, 3], 
...     wtype=["simple", "exp"],
...     return_raw=True)
>>> vbt.MA.run(ts2, 2, "simple", use_raw=raw).ma
ma_window            2     
ma_wtype        simple     
                a    b
2020-01-01    NaN  NaN
2020-01-02    1.5  2.5
2020-01-03    2.5  1.5
2020-01-04    2.5  1.5
2020-01-05    1.5  2.5
2020-01-06    1.5  2.5
2020-01-07    2.5  1.5

>>> vbt.MA.run(ts2, 2, "exp", use_raw=raw).ma
ValueError: (2, 2) is not in list

```

This way, we can pre-compute indicators.

## Manual caching[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#manual-caching "Permanent link")

Another performance enhancement can be introduced by caching manually, which must be implemented inside `custom_func`. Additionally, `custom_func` must accept a `return_cache` argument for returning the cache and a `use_cache` argument for reusing the cache (similar to `return_raw` and `use_raw`, remember?) Luckily for us, [IndicatorFactory.with\_apply\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_apply_func) takes a `cache_func` and implements a `custom_func` that meets the requirements above.

Consider the following scenario: we want to calculate the relative distance between two computationally-expensive rolling windows. We have already decided on the value for the first window, and want to test thousands of values for the second window. Without caching, and even with `run_unique` enabled, the first rolling window will be re-calculated over and over again and waste our resources:

```
>>> def roll_mean_expensive_nb(ts, w):
...     for i in range(100):
...         out = vbt.nb.rolling_mean_nb(ts, w)
...     return out

>>> def apply_func(ts, w1, w2):
...     roll_mean1 = roll_mean_expensive_nb(ts, w1)
...     roll_mean2 = roll_mean_expensive_nb(ts, w2)
...     return (roll_mean2 - roll_mean1) / roll_mean1

>>> RelMADist = vbt.IF(
...     class_name="RelMADist",
...     input_names=['ts'],
...     param_names=['w1', 'w2'],
...     output_names=['out'],
... ).with_apply_func(apply_func)

>>> RelMADist.run(ts2, 2, 3).out
relmadist_w1                   2
relmadist_w2                   3
                     a         b
2020-01-01         NaN       NaN
2020-01-02         NaN       NaN
2020-01-03   -0.200000  0.333333
2020-01-04   -0.066667  0.111111
2020-01-05    0.333333 -0.200000
2020-01-06    0.111111 -0.066667
2020-01-07   -0.200000  0.333333

>>> %timeit RelMADist.run(ts2, 2, np.arange(2, 1000))
294 ms ± 52.9 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)

```

To avoid this, let's pre-compute all unique rolling windows in `cache_func` and use them in `apply_func`:

```
>>> def cache_func(ts, w1, w2):  
...     cache_dict = dict()
...     for w in w1 + w2:
...         if w not in cache_dict:
...             cache_dict[w] = roll_mean_expensive_nb(ts, w)
...     return cache_dict

>>> def apply_func(ts, w1, w2, cache_dict):  
...     return (cache_dict[w2] - cache_dict[w1]) / cache_dict[w1]

>>> RelMADist = vbt.IF(
...     class_name="RelMADist",
...     input_names=['ts'],
...     param_names=['w1', 'w2'],
...     output_names=['out'],
... ).with_apply_func(apply_func, cache_func=cache_func)

>>> RelMADist.run(ts2, 2, 3).out
relmadist_w1                   2
relmadist_w2                   3
                     a         b
2020-01-01         NaN       NaN
2020-01-02         NaN       NaN
2020-01-03   -0.200000  0.333333
2020-01-04   -0.066667  0.111111
2020-01-05    0.333333 -0.200000
2020-01-06    0.111111 -0.066667
2020-01-07   -0.200000  0.333333

>>> %timeit RelMADist.run(ts2, 2, np.arange(2, 1000))
119 ms ± 335 µs per loop (mean ± std. dev. of 7 runs, 10 loops each)

```

We have cut down the processing time in half!

### Per column[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#per-column "Permanent link")

What happens when the user passes `per_column=True` to apply each parameter combination per column? Internally, [IndicatorFactory.with\_apply\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_apply_func) splits any input, in-output, and parameter array per column, and passes one element of each to `apply_func` at a time. But the same splitting procedure cannot be performed for `cache_func` since we would suddenly get 1) a list of input arrays instead of a single array (if the caching function was Numba-compiled, this would yield an error since Numba doesn't allow the same argument with two different types), and 2) each input array in that list would be different, so keeping a single caching dict with parameter combinations as keys would be not enough.

To account for this edge case, vectorbt passes input and in-output arrays in their regular shape (not split), but it also passes an argument `per_column` set to True, such that `cache_func` knows that each parameter corresponds to only one column in the input data. In the caching function, we can then use this flag to decide what to do next. Usually, we just disable caching and calculate everything directly in the apply function.

```
>>> def cache_func(ts, w1, w2, per_column=False):
...     if per_column:
...         return None
...     cache_dict = dict()
...     for w in w1 + w2:
...         if w not in cache_dict:
...             cache_dict[w] = roll_mean_expensive_nb(ts, w)
...     return cache_dict

>>> def apply_func(ts, w1, w2, cache_dict=None):  
...     if cache_dict is None:
...         roll_mean1 = roll_mean_expensive_nb(ts, w1)
...         roll_mean2 = roll_mean_expensive_nb(ts, w2)
...     else:
...         roll_mean1 = cache_dict[w1]
...         roll_mean2 = cache_dict[w2]
...     return (roll_mean2 - roll_mean1) / roll_mean1
...     

>>> RelMADist = vbt.IF(
...     class_name="RelMADist",
...     input_names=['ts'],
...     param_names=['w1', 'w2'],
...     output_names=['out'],
... ).with_apply_func(apply_func, cache_func=cache_func)

>>> RelMADist.run(ts2, 2, 3).out
relmadist_w1                   2
relmadist_w2                   3
                     a         b
2020-01-01         NaN       NaN
2020-01-02         NaN       NaN
2020-01-03   -0.200000  0.333333
2020-01-04   -0.066667  0.111111
2020-01-05    0.333333 -0.200000
2020-01-06    0.111111 -0.066667
2020-01-07   -0.200000  0.333333

>>> RelMADist.run(ts2, [2, 2], [3, 4], per_column=True).out
relmadist_w1                   2
relmadist_w2         3         4
                     a         b
2020-01-01         NaN       NaN
2020-01-02         NaN       NaN
2020-01-03   -0.200000       NaN
2020-01-04   -0.066667  0.333333
2020-01-05    0.333333 -0.200000
2020-01-06    0.111111 -0.200000
2020-01-07   -0.200000  0.333333

```

The design above is even better than the previous one because now cache is optional and any other function can call `apply_func` without being forced to do caching by itself. And it works in Numba too!

### Reusing cache[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#reusing-cache_1 "Permanent link")

Similar to raw outputs, we can force [IndicatorBase.run\_pipeline](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.run_pipeline) and `custom_func` to return the cache, so it can be used in other calculations or even indicators. The clear advantage of this approach is that we don't rely on some fixed set of parameter combinations anymore, but on the values of each parameter, which gives us more granularity in managing performance.

```
>>> cache = RelMADist.run(
...     ts2, 
...     w1=2, 
...     w2=np.arange(2, 1000), 
...     return_cache=True)

>>> %timeit RelMADist.run( \
...     ts2, \
...     w1=np.arange(2, 1000), \
...     w2=np.arange(2, 1000), \
...     use_cache=cache)
7.7 ms ± 153 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)

```

## Stacking[¶](https://vectorbt.pro/pvt_40509f46/documentation/indicators/development/#stacking "Permanent link")

Similar to regular functions, indicators can depend upon each other. To build a stacked indicator, the first step is merging their inputs and parameters. Consider the old but gold moving average crossover, where we want to use the TA-Lib `SMA` indicator twice: once for the fast and once for the slow moving average. By looking at the arguments accepted by the indicator's `run` method, we see that it accepts a time series `close` and a parameter `timeperiod`. Since both moving averages are computed from the same time series, our only input is `close`. The parameter `timeperiod` should be different for both moving averages, thus we need to define two parameters: `timeperiod1` and `timeperiod2` (you can choose any other names).

```
>>> vbt.phelp(vbt.talib('SMA').run)
SMA.run(
    close,
    timeperiod=Default(value=30),
    short_name='sma',
    hide_params=None,
    hide_default=True,
    **kwargs
):
    Run `SMA` indicator.

    * Inputs: `close`
    * Parameters: `timeperiod`
    * Outputs: `real`

    Pass a list of parameter names as `hide_params` to hide their column levels.
    Set `hide_default` to False to show the column levels of the parameters with a default value.

    Other keyword arguments are passed to `SMA.run_pipeline`.

>>> def apply_func(close, timeperiod1, timeperiod2):
...     fast_ma = vbt.talib('SMA').run(close, timeperiod1)
...     slow_ma = vbt.talib('SMA').run(close, timeperiod2)
...     entries = fast_ma.real_crossed_above(slow_ma)
...     exits = fast_ma.real_crossed_below(slow_ma)
...     return (fast_ma.real, slow_ma.real, entries, exits)

>>> MACrossover = vbt.IF(
...     class_name="CrossSig",
...     input_names=['close'],
...     param_names=['timeperiod1', 'timeperiod2'],
...     output_names=['fast_ma', 'slow_ma', 'entries', 'exits'],
... ).with_apply_func(apply_func)

>>> MACrossover.run(ts2, 2, 3).entries
crosssig_timeperiod1             2
crosssig_timeperiod2             3
                          a      b
2020-01-01            False  False
2020-01-02            False  False
2020-01-03            False  False
2020-01-04            False  False
2020-01-05            False   True
2020-01-06            False  False
2020-01-07             True  False

```

This implementation has one drawback though: we needlessly create two indicator instances and convert between NumPy arrays and Pandas objects back and forth. An ideal implementation would only use NumPy and Numba. Gladly for us, any indicator constructed by [IndicatorFactory](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory) implements the `return_raw` argument, which can be used to access the actual NumPy array(s) returned by the particular calculation function.

```
>>> def sma(close, timeperiod):
...     return vbt.talib('SMA').run(close, timeperiod, return_raw=True)[0][0]

>>> def apply_func(close, timeperiod1, timeperiod2):
...     fast_ma = sma(close, timeperiod1)
...     slow_ma = sma(close, timeperiod2)
...     entries = vbt.nb.crossed_above_nb(fast_ma, slow_ma)
...     exits = vbt.nb.crossed_above_nb(slow_ma, fast_ma)
...     return (fast_ma, slow_ma, entries, exits)

```

Want another approach? Any indicator class created by [IndicatorFactory.with\_custom\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_custom_func) has an attribute `custom_func` to access the custom function. Similarly, any indicator class created by [IndicatorFactory.with\_apply\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.with_apply_func) has an attribute `apply_func` to access the apply function. This means that we can call the indicator's `custom_func` from our `custom_func` and the indicator's `apply_func` from our `apply_func`. Just note that `apply_func` of all parsed indicators was created dynamically with `pass_packed` set to True, and thus it accepts arguments in the packed form:

```
>>> vbt.phelp(vbt.talib('SMA').apply_func)
apply_func(
    input_tuple,
    in_output_tuple,
    param_tuple,
    **_kwargs
)

>>> def sma(close, timeperiod):
...     return vbt.talib('SMA').apply_func((close,), (), (timeperiod,))

```

That's the fastest it can get!

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/documentation/indicators/development.py.txt)