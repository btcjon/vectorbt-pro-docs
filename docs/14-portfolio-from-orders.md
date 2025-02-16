Instead of building our custom simulator from scratch, we can make use of one of the preset simulation methods offered by vectorbt. There are three predominantly used methods: [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders), [Portfolio.from\_signals](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_signals), and [Portfolio.from\_order\_func](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_order_func). Each one has its own benefits and drawbacks, but all of them follow the same iteration schema that we discussed previously: iterate over the rows and columns, and at each step, convert the current element of all the input data passed by the user into an order request, and process it by updating the current simulation state and by appending the filled order record to an array. This array along with other information can later be used during the reconstruction phase to analyze the simulation.

[Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders) is the most basic method out of three: it doesn't take any UDFs, and allows us to provide every bit of information on orders as separate, broadcastable arrays. Literally **each** element across all the passed arrays will be converted into an instance of [Order](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.Order) and processed as usual. Since the number of orders is limited by the number of elements in the passed arrays, we can issue **and execute** only one order per timestamp and asset.

For example, passing `[0.1, -0.1, np.nan]` as the order size array and `[11, 10, 12]` as the order price array will generate three orders at three subsequent timestamps:

1.  Buy 0.1 shares for $11
2.  Sell 0.1 shares for $10
3.  Do nothing (size of NaN gets ignored)

Hint

This method should be used when you know exactly what to order at each timestamp. And, as practice shows, many types of signals and other inputs can be successfully converted into an order format for a nice speedup. For example, if your entries and exits are cleaned (i.e., one exit comes exactly after one entry and vice versa), you can convert them to order size using `entries.astype(int) - exits.astype(int)`, which will order 1 share once a signal is encountered, in both directions.

## Numba[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#numba "Permanent link")

The backbone of this method is the Numba-compiled function [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb), which is the fastest simulation function out of three, but also the only one that can be (and is) safely cached in Numba because it doesn't depend on any complex or global data. It's also using flexible indexing, it's registered as a chunkable function, and it can be parallelized by Numba with a single command.

The arguments of this simulation function include some arguments we've encountered in the documentation on simulation: target shape, group lengths, initial cash, and some others. The arguments we haven't seen before include the call sequence array, initial state arrays (such as `init_position`), continuous state change arrays (such as `cash_deposits`), order information arrays (such as `size`), and various flags for controlling the simulation process (such as `save_returns`). Also, most arguments have sensitive default values that are consistent across most Numba-compiled functions defined in [portfolio.nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/).

### Order fields[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#order-fields "Permanent link")

Every single field in the named tuple [Order](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.Order) is present as an argument in the signature of this simulation function, and can be provided in a format suitable for flexible indexing.

Let's simulate the three orders we mentioned above:

```
>>> from vectorbtpro import *

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(3, 1),  
...     group_lens=np.array([1]),  
...     size=np.array([[0.1], [-0.1], [np.nan]]),  
...     price=np.array([[11], [10], [12]])
... )
>>> sim_out.order_records
array([(0, 0, 0, 0.1, 11., 0., 0), (1, 0, 1, 0.1, 10., 0., 1)],
      dtype={'names':['id','col','idx','size','price','fees','side'], ...})

```

The result of the simulation is an instance of the named tuple [SimulationOutput](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SimulationOutput), which consists of the filled order and log records, and other supporting information for post-analysis:

```
>>> print(vbt.prettify(sim_out))
SimulationOutput(
    order_records=<numpy.ndarray object at 0x7f88606d5710 of shape (2,)>,
    log_records=<numpy.ndarray object at 0x7f8860907fa8 of shape (0,)>,
    cash_deposits=<numpy.ndarray object at 0x7f8860907f50 of shape (1, 1)>,
    cash_earnings=<numpy.ndarray object at 0x7f8860a355b0 of shape (1, 1)>,
    call_seq=None,
    in_outputs=FSInOutputs(
        returns=<numpy.ndarray object at 0x7f88a1976fa8 of shape (0, 0)>
    )
)

```

Info

Despite the fact that we didn't instruct vectorbt to create an array with log records, cash deposits, and cash earnings, we still see those arrays in the simulation output. Because Numba has difficulties in processing optional writable arrays, we cannot make those outputs `None`, but instead, we create empty arrays with ultra-small shapes to denote that they should be ignored during post-analysis.

Here's a basic helper function to pretty-print order records:

```
>>> def print_orders(target_shape, order_records):
...     wrapper = vbt.ArrayWrapper.from_shape(target_shape)
...     print(vbt.Orders(wrapper, order_records).readable)

>>> print_orders((3, 1), sim_out.order_records)
   Order Id  Column  Timestamp  Size  Price  Fees  Side
0         0       0          0   0.1   11.0   0.0   Buy
1         1       0          1   0.1   10.0   0.0  Sell

```

To apply any information on **every** element, we can provide a scalar. This works because most simulation methods convert any scalar into a two-dimensional array suitable for [flexible indexing](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/#flexible-indexing) automatically! We can also provide any information that should be applied per row, such as price, as a one-dimensional array, like this:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(3, 1),
...     group_lens=np.array([1]),
...     size=np.array([0.1, -0.1, np.nan]),
...     price=np.array([11, 10, 12]),
...     fees=0.01
... )
>>> print_orders((3, 1), sim_out.order_records)
   Order Id  Column  Timestamp  Size  Price   Fees  Side
0         0       0          0   0.1   11.0  0.011   Buy
1         1       0          1   0.1   10.0  0.010  Sell

```

1.  Apply 1% commission on all orders

Important

Default broadcasting rules of vectorbt are slightly different from the NumPy broadcasting rules: in NumPy, `(3,)` will broadcast along columns in the shape `(3, 1)`, but vectorbt assumes that flexible two-dimensional arrays are always time series and thus are provided per row.

If we want to provide any information per column instead, we always need wrap it into a two-dimensional array. We can additionally make this array have only one row to apply information to all rows. Let's test multiple size values by providing them per column, while the price is provided per row:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(3, 3),  
...     group_lens=np.array([1, 1, 1]),  
...     size=np.array([[np.inf, np.nan, -np.inf]]),  
...     price=np.array([11, 10, 12]),  
...     fees=0.01  
... )
>>> print_orders((3, 3), sim_out.order_records)
   Order Id  Column  Timestamp    Size  Price      Fees  Side
0         0       0          0  9.0009   11.0  0.990099   Buy
1         0       2          0  9.0009   11.0  0.990099  Sell

```

This has the same effect as if we broadcasted all the arrays prior to passing.

```
>>> size, price, fees = vbt.broadcast_arrays(  
...     np.array([[np.inf, np.nan, -np.inf]]),
...     np.array([11, 10, 12]),
...     0.01
... )
>>> size
array([[ inf,  nan, -inf],
       [ inf,  nan, -inf],
       [ inf,  nan, -inf]])

>>> price
array([[11, 11, 11],
       [10, 10, 10],
       [12, 12, 12]])

>>> fees
array([[0.01, 0.01, 0.01],
       [0.01, 0.01, 0.01],
       [0.01, 0.01, 0.01]])

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=size.shape,  
...     group_lens=np.full(size.shape[1], 1),
...     size=size,
...     price=price,
...     fees=fees
... )
>>> print_orders(size.shape, sim_out.order_records)
   Order Id  Column  Timestamp    Size  Price      Fees  Side
0         0       0          0  9.0009   11.0  0.990099   Buy
1         0       2          0  9.0009   11.0  0.990099  Sell

```

Notice how all the arrays have the same shape `(3, 3)`, which becomes our target shape.

Important

We cannot use `np.broadcast_arrays` since one-dimensional arrays will broadcast along columns.

Info

Visit the API documentation of [Order](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.Order) to learn more about different arguments and their meanings.

### Grouping[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#grouping "Permanent link")

If any element in the array `group_lens` is greater than 1, it's assumed that the columns are grouped and cash sharing is enabled by default. Let's simulate a portfolio with two assets where we try to order as many shares as possible in both assets:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(1, 2),  
...     group_lens=np.array([2]),  
...     size=np.array([[np.inf, np.inf]]),  
...     price=np.array([[10, 5]])
... )
>>> print_orders((1, 2), sim_out.order_records)
   Order Id  Column  Timestamp  Size  Price  Fees Side
0         0       0          0  10.0   10.0   0.0  Buy

```

We see that the first asset used up the entire cash and left the second one without funds.

### Call sequence[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#call-sequence "Permanent link")

One practical feature of [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb) is that we can provide our own call sequence to change the order in which columns are processed inside their groups. Without providing a call sequence, the default processing order is _from left to right_. For example, let's perform two rebalancing steps with the default call sequence: allocate 100% to the second asset at the first timestamp, and close out the position and allocate 100% to the first asset at the second timestamp.

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(2, 2),
...     group_lens=np.array([2]),
...     size=np.array([[0, 1], [1, 0]]),
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     price=np.array([[10, 5], [11, 4]])
... )
>>> print_orders((2, 2), sim_out.order_records)
   Order Id  Column  Timestamp  Size  Price  Fees  Side
0         0       1          0  20.0    5.0   0.0   Buy
1         1       1          1  20.0    4.0   0.0  Sell

```

We see that only the column `1` has been processed. This is because we attempted to allocate 100% to the first asset without first closing out the position of the second asset at the second timestamp. To account for this order, we can pass our own call sequence:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(2, 2),
...     group_lens=np.array([2]),
...     size=np.array([[0, 1], [1, 0]]),
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     price=np.array([[10, 5], [11, 4]]),
...     call_seq=np.array([[0, 1], [1, 0]])  
... )
>>> print_orders((2, 2), sim_out.order_records)
   Order Id  Column  Timestamp       Size  Price  Fees  Side
0         0       0          1   7.272727   11.0   0.0   Buy
1         0       1          0  20.000000    5.0   0.0   Buy
2         1       1          1  20.000000    4.0   0.0  Sell

```

Info

Order records are partitioned by column and are guaranteed to come in the order they were filled in each column. Also, order ids (the first field) are generated per column, not globally!

The first asset at the second timestamp now has the required funds to go long.

To avoid providing the call sequence manually, we can leave it at `None` and enable `auto_call_seq` instead. In such a case, vectorbt will automatically sort the columns by their approximated order value:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(2, 2),
...     group_lens=np.array([2]),
...     size=np.array([[0, 1], [1, 0]]),
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     price=np.array([[10, 5], [11, 4]]),
...     auto_call_seq=True  
... )
>>> print_orders((2, 2), sim_out.order_records)
   Order Id  Column  Timestamp       Size  Price  Fees  Side
0         0       0          1   7.272727   11.0   0.0   Buy
1         0       1          0  20.000000    5.0   0.0   Buy
2         1       1          1  20.000000    4.0   0.0  Sell

```

Sometimes though, we would like to throw a look at the sequence in which orders were processed, which isn't reflected in the order records. For this, we can provide our own call sequence for vectorbt to change it in-place and return it as a field of the [SimulationOutput](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SimulationOutput) named tuple. The call sequence array must be pre-filled with indices in the strict order from 0 to `n`, where `n` is the length of the particular group of columns. We can easily build such an array using the function [build\_call\_seq](https://vectorbt.pro/pvt_40509f46/api/portfolio/call_seq/#vectorbtpro.portfolio.call_seq.build_call_seq), which takes the target shape, the group lengths, and the call sequence type from [CallSeqType](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.CallSeqType):

```
>>> from vectorbtpro.portfolio.call_seq import build_call_seq

>>> call_seq = build_call_seq(
...     target_shape=(2, 2), 
...     group_lens=np.array([2]), 
...     call_seq_type=vbt.pf_enums.CallSeqType.Default  
... )

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(2, 2),
...     group_lens=np.array([2]),
...     size=np.array([[0, 1], [1, 0]]),
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     price=np.array([[10, 5], [11, 4]]),
...     call_seq=call_seq,
...     auto_call_seq=True
... )
>>> sim_out.call_seq
array([[0, 1],
       [1, 0]])

```

The generated and then sorted call sequence exactly follows the correct one we constructed manually before.

Hint

There is usually no big reason in providing your own call sequence. Setting it to `None` (default) and turning on the flag `auto_call_seq` will derive the best call sequence in the most resource-friendly manner.

### Filling returns[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#filling-returns "Permanent link")

In addition to returning order records, we can instruct vectorbt to also fill the return based on the portfolio value at the end of each bar. The constructed series will be available under the field `returns` of [SimulationOutput.in\_outputs](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SimulationOutput.in_outputs), and can be used to calculate a range of metrics, such as the Sharpe ratio. Let's do the following: pull the BTC price and calculate the return of a simple buy-and-hold strategy. We'll see that the filled returns will closely match the returns calculated from the price directly:

```
>>> data = vbt.YFData.pull("BTC-USD", end="2022-01-01")
>>> symbol_wrapper = data.get_symbol_wrapper()

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=symbol_wrapper.shape_2d,  
...     group_lens=np.array([1]),
...     open=data.get("Open").values,  
...     high=data.get("High").values,
...     low=data.get("Low").values,
...     close=data.get("Close").values,
...     save_returns=True  
... )
>>> returns = symbol_wrapper.wrap(sim_out.in_outputs.returns)  
>>> returns
Date
2014-09-17 00:00:00+00:00    0.000000
2014-09-18 00:00:00+00:00   -0.071926
2014-09-19 00:00:00+00:00   -0.069843
...                               ...
2021-12-29 00:00:00+00:00   -0.024042
2021-12-30 00:00:00+00:00    0.015791
2021-12-31 00:00:00+00:00   -0.018476
Freq: D, Name: BTC-USD, Length: 2663, dtype: float64

>>> data.get("Close").vbt.to_returns()  
Date
2014-09-17 00:00:00+00:00    0.000000
2014-09-18 00:00:00+00:00   -0.071926
2014-09-19 00:00:00+00:00   -0.069843
...                               ...
2021-12-29 00:00:00+00:00   -0.024042
2021-12-30 00:00:00+00:00    0.015791
2021-12-31 00:00:00+00:00   -0.018476
Freq: D, Name: Close, Length: 2663, dtype: float64

```

Returns are calculated from the value of each group, thus the number of columns in the returned time series matches the number of groups in `group_lens`:

```
>>> mult_data = vbt.YFData.pull(  
...     ["BTC-USD", "ETH-USD"], 
...     end="2022-01-01",
...     missing_index="drop"
... )
>>> mult_symbol_wrapper = mult_data.get_symbol_wrapper()

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=mult_symbol_wrapper.shape_2d,
...     group_lens=np.array([2]),  
...     close=mult_data.get("Close").values,
...     size=np.array([[0.5, 0.5]]),  
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     save_returns=True
... )
>>> returns = mult_symbol_wrapper\
...     .replace(columns=["group"], ndim=1)\
...     .wrap(sim_out.in_outputs.returns)  
>>> returns
Date
2017-11-09 00:00:00+00:00    0.000000
2017-11-10 00:00:00+00:00   -0.070482
2017-11-11 00:00:00+00:00    0.006159
...                               ...
2021-12-29 00:00:00+00:00   -0.034684
2021-12-30 00:00:00+00:00    0.019652
2021-12-31 00:00:00+00:00   -0.013406
Freq: D, Name: group, Length: 1514, dtype: float64

```

### Initial state[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#initial-state "Permanent link")

Initial state defines the starting conditions of the entire trading environment. It mainly consists of three variables: the initial cash, the initial position, and the average entry price of the initial position. Each variable has at most one dimension and is either defined per column or per group.

The initial cash is the most important variable out of three, and can be provided as a flexible array `init_cash` with values per column or per group with cash sharing. As a rule of thumb: it must be either a scalar or one-dimensional array with the same number of elements as there are in `group_lens`.

Let's create a group of two columns and allocate 50% to each column, and another two groups with one column and 100% allocation each. This way, we can perform two independent backtests: with grouping and without. By supplying the initial cash as a single number ($100 by default), the first group will split it among two assets, and thus the starting condition of the grouped columns will differ from that of the columns without grouping, which isn't ideal if you want to set up fair statistical experiments.

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(1, 4),
...     group_lens=np.array([2, 1, 1]),
...     init_cash=100,  
...     size=np.array([[0.5, 0.5, 1.0, 1.0]]),  
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     price=np.array([[10, 11, 10, 11]]),
... )
>>> print_orders((1, 4), sim_out.order_records)
   Order Id  Column  Timestamp       Size  Price  Fees Side
0         0       0          0   5.000000   10.0   0.0  Buy
1         0       1          0   4.545455   11.0   0.0  Buy
2         0       2          0  10.000000   10.0   0.0  Buy
3         0       3          0   9.090909   11.0   0.0  Buy

```

Let's fix this and provide the first group with twice as much capital:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=(1, 4),
...     group_lens=np.array([2, 1, 1]),
...     init_cash=np.array([200, 100, 100]),  
...     size=np.array([[0.5, 0.5, 1.0, 1.0]]),
...     size_type=vbt.pf_enums.SizeType.TargetPercent,
...     price=np.array([[10, 11, 10, 11]]),
... )
>>> print_orders((1, 4), sim_out.order_records)
   Order Id  Column  Timestamp       Size  Price  Fees Side
0         0       0          0  10.000000   10.0   0.0  Buy
1         0       1          0   9.090909   11.0   0.0  Buy
2         0       2          0  10.000000   10.0   0.0  Buy
3         0       3          0   9.090909   11.0   0.0  Buy

```

Apart from the initial cash, we can also specify the initial position of each asset to start with. Let's start the simulation with 1 BTC and 1 ETH, and calculate the returns:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=mult_symbol_wrapper.shape_2d,
...     group_lens=np.array([1, 1]),
...     init_position=np.array([1, 1]),  
...     close=mult_data.get("Close").values,
...     save_returns=True
... )
>>> returns = mult_symbol_wrapper.wrap(sim_out.in_outputs.returns)
>>> returns
symbol                      BTC-USD   ETH-USD
Date                                         
2017-11-09 00:00:00+00:00       NaN       NaN
2017-11-10 00:00:00+00:00 -0.073554 -0.067411
2017-11-11 00:00:00+00:00 -0.039368  0.051555
...                             ...       ...
2021-12-29 00:00:00+00:00 -0.024042 -0.045348
2021-12-30 00:00:00+00:00  0.015791  0.023514
2021-12-31 00:00:00+00:00 -0.018476 -0.008406

[1514 rows x 2 columns]

```

The first data point is NaN because vectorbt cannot calculate the initial value of each portfolio instance without knowing the entry price of each initial position. Let's fix this by setting the entry price to the first open price:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=mult_symbol_wrapper.shape_2d,
...     group_lens=np.array([1, 1]),
...     init_position=np.array([1, 1]),
...     init_price=mult_data.get("Open").values[0],  
...     close=mult_data.get("Close").values,
...     save_returns=True
... )
>>> returns = mult_symbol_wrapper.wrap(sim_out.in_outputs.returns)
>>> returns
symbol                      BTC-USD   ETH-USD
Date                                         
2017-11-09 00:00:00+00:00 -0.040182  0.029950
2017-11-10 00:00:00+00:00 -0.073554 -0.067411
2017-11-11 00:00:00+00:00 -0.039368  0.051555
...                             ...       ...
2021-12-29 00:00:00+00:00 -0.024042 -0.045348
2021-12-30 00:00:00+00:00  0.015791  0.023514
2021-12-31 00:00:00+00:00 -0.018476 -0.008406

[1514 rows x 2 columns]

```

Important

Make sure to distinguish between a column and a group!

Columns represent individual assets, and most information in vectorbt must be supplied at this (lowest) level of granularity. Such arrays must broadcast against `target_shape`. Groups, on the other hand, represent collections of assets that share the same cash, and only some variables related to cash must be provided per group. Such arrays must broadcast against `group_lens.shape`.

Hint

If you're not sure whether an argument is expected as a one-dimensional or two-dimensional array, take a look into the source code of the function: one-dimensional arrays are annotated with `FlexArray1dLike` and two-dimensional with `FlexArray2dLike`. If an argument is expected as strictly one-dimensional or two-dimensional array (i.e., a scalar is not allowed), it's annotated with `FlexArray1d` and `FlexArray2d` respectively. If an argument is not flexible at all (i.e., it must have the same shape as `target_shape`), it will be just `Array1d` and `Array2d` respectively.

### Cash deposits[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#cash-deposits "Permanent link")

In addition to providing the initial cash, we can also deposit or withdraw arbitrary cash amounts as the simulation progresses. Similar to `init_cash`, the argument `cash_deposits` must be specified per group. The only difference is that the array now should broadcast along rows and columns, and specify the deposited or withdrawn amount at each timestamp. Thanks to flexible indexing, we can specify the amount to be applied per each element, row, group, or to the entire frame. The actual operation then takes place at the beginning of each bar.

Let's simulate a simple [DCA](https://www.investopedia.com/terms/d/dollarcostaveraging.asp) strategy where we deposit $100 at the beginning of each year and spend it right away:

```
>>> cash_deposits = symbol_wrapper.fill(0)  
>>> cash_deposits.vbt.set(100, every="Y", inplace=True)

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=symbol_wrapper.shape_2d,
...     group_lens=np.array([1]),
...     cash_deposits=cash_deposits.values,
...     close=data.get("Close").values
... )
>>> print_orders(symbol_wrapper.shape_2d, sim_out.order_records)
   Order Id  Column  Timestamp      Size         Price  Fees Side
0         0       0          0  0.218659    457.334015   0.0  Buy
1         1       0        106  0.318219    314.248993   0.0  Buy
2         2       0        471  0.230238    434.334015   0.0  Buy
3         3       0        837  0.100168    998.325012   0.0  Buy
4         4       0       1202  0.007322  13657.200195   0.0  Buy
5         5       0       1567  0.026018   3843.520020   0.0  Buy
6         6       0       1932  0.013889   7200.174316   0.0  Buy
7         7       0       2298  0.003404  29374.152344   0.0  Buy

```

Below, we're doing the same but on a group with two assets and equal allocations. Since the array `cash_deposits` changes the cash balance, it must have the same number of columns as we have groups (with cash sharing).

```
>>> cash_deposits = mult_symbol_wrapper\
...     .replace(columns=["group"], ndim=1)\
...     .fill(0)  
>>> cash_deposits.vbt.set(100, every="Y", inplace=True)
>>> size = mult_symbol_wrapper.fill(np.nan)  
>>> size.vbt.set(0.5, every="Y", inplace=True)
>>> size.iloc[0] = 0.5  

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=mult_symbol_wrapper.shape_2d,
...     group_lens=np.array([2]),
...     cash_deposits=cash_deposits.values,
...     close=mult_data.get("Close").values,
...     size=size.values,
...     size_type=vbt.pf_enums.SizeType.TargetPercent
... )
>>> print_orders(mult_symbol_wrapper.shape_2d, sim_out.order_records)
   Order Id  Column  Timestamp      Size         Price  Fees  Side
0         0       0          0  0.006999   7143.580078   0.0   Buy
1         1       0         53  0.004569  13657.200195   0.0   Buy
2         2       0        418  0.010971   3843.520020   0.0   Buy
3         3       0        783  0.001263   7200.174316   0.0   Buy
4         4       0       1149  0.003404  29374.152344   0.0   Buy
5         0       1          0  0.155820    320.884003   0.0   Buy
6         1       1         53  0.048663    772.640991   0.0   Buy
7         2       1        418  0.410697    140.819412   0.0   Buy
8         3       1        783  0.695013    130.802002   0.0   Buy
9         4       1       1149  0.108007    730.367554   0.0  Sell

```

To withdraw cash, we need to provide a negative amount. If the amount of cash to be withdrawn exceeds the amount of cash we have in our account, only the available cash will be withdrawn. Let's start with 1 BTC, sell 10% each year, and continuously withdraw the entire cash balance:

```
>>> size = symbol_wrapper.fill(np.nan)  
>>> size.vbt.set(-0.1, every="Y", inplace=True)

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=symbol_wrapper.shape_2d,
...     group_lens=np.array([1]),
...     init_position=1,
...     cash_deposits=-np.inf,  
...     close=data.get("Close").values,
...     size=size.values,
...     size_type=vbt.pf_enums.SizeType.Percent,  
...     direction=vbt.pf_enums.Direction.LongOnly  
... )
>>> print_orders(symbol_wrapper.shape_2d, sim_out.order_records)
   Order Id  Column  Timestamp      Size         Price  Fees  Side
0         0       0        106  0.100000    314.248993   0.0  Sell
1         1       0        471  0.090000    434.334015   0.0  Sell
2         2       0        837  0.081000    998.325012   0.0  Sell
3         3       0       1202  0.072900  13657.200195   0.0  Sell
4         4       0       1567  0.065610   3843.520020   0.0  Sell
5         5       0       1932  0.059049   7200.174316   0.0  Sell
6         6       0       2298  0.053144  29374.152344   0.0  Sell

>>> cash_deposits = symbol_wrapper.wrap(sim_out.cash_deposits)  
>>> print(cash_deposits[cash_deposits != 0])  
Date
2014-09-17 00:00:00+00:00    -100.000000
2015-01-02 00:00:00+00:00     -31.424899
2016-01-02 00:00:00+00:00     -39.090061
2017-01-02 00:00:00+00:00     -80.864326
2018-01-02 00:00:00+00:00    -995.609894
2019-01-02 00:00:00+00:00    -252.173348
2020-01-02 00:00:00+00:00    -425.163093
2021-01-02 00:00:00+00:00   -1561.062890
Name: BTC-USD, dtype: float64

```

As we see, on the first date of each year, we sold 10% of our position, and since any changes related to cash are only applied at the beginning of each bar, the cash resulting from the transaction can only be withdrawn on the date that follows. Also, whenever we specify cash deposits, vectorbt will create a full-scale array [SimulationOutput.cash\_deposits](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SimulationOutput.cash_deposits) to account for values that couldn't be satisfied, such as `-np.inf`, which was replaced by the cash balance at each timestamp. Without having this array, we wouldn't be able to properly reconstruct the simulation during the post-analysis phase.

### Cash earnings[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#cash-earnings "Permanent link")

In contrast to cash deposits, cash earnings (`cash_earnings`) mark cash that is either inflowing to or outflowing away from the user, and so they have a direct effect on the profitability. Also, they are applied at the end of each bar. For example, we can use (negative) cash earnings to charge some fixed commission during a pre-determined period of time, or to simulate profit taking from stacking cryptocurrency. One of the most useful applications of cash earnings are cash dividends, which are expressed by a separate argument `cash_dividends`. Cash dividends are multiplied by the current position size and added to the cash earnings. Similar to cash deposits, vectorbt creates a separate array for cash earnings once it registers any non-zero value in either cash earnings or cash dividends provided by the user, and writes final operations to this array, available under [SimulationOutput.cash\_earnings](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SimulationOutput.cash_earnings).

Let's simulate investing in Apple and keeping the dividends:

```
>>> aapl_data = vbt.YFData.pull("AAPL", end="2022-01-01")
>>> aapl_wrapper = aapl_data.get_symbol_wrapper()
>>> size = aapl_wrapper.fill()  
>>> size.iloc[0] = np.inf

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=aapl_wrapper.shape_2d,
...     group_lens=np.array([1]),
...     close=aapl_data.get("Close").values,
...     cash_dividends=aapl_data.get("Dividends").values,
...     size=size.values
... )
>>> print_orders(aapl_wrapper.shape_2d, sim_out.order_records)
   Order Id  Column  Timestamp        Size     Price  Fees Side
0         0       0          0  996.754204  0.100326   0.0  Buy

>>> cash_earnings = aapl_wrapper.wrap(sim_out.cash_earnings)
>>> print(cash_earnings[cash_earnings != 0])  
Date
1987-05-11 00:00:00+00:00      0.534260
1987-08-10 00:00:00+00:00      0.534260
1987-11-17 00:00:00+00:00      0.711683
...                                 ...
2021-05-07 00:00:00+00:00    219.285925
2021-08-06 00:00:00+00:00    219.285925
2021-11-05 00:00:00+00:00    219.285925
Name: AAPL, Length: 73, dtype: float64

```

### Max record count[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#max-record-count "Permanent link")

By default, since vectorbt doesn't know the number of order records to be filled in advance, it creates an empty array of the same shape as `target_shape` and gradually "appends" new records. As soon as there are hundreds of thousands or even millions of elements in the target shape, we may run out of memory by trying to create such a huge empty array with such a complex data type. To avoid stressing our RAM too much, we can specify the maximum number of potential records to be filled in each column using `max_order_records` for order records and `max_log_records` for log records.

For instance, if we have tick data with one million of data points, and we want to simulate a simple strategy where we buy at the first timestamp and then sell at the latest timestamp, it makes sense to limit the number of potential orders in each column to just 2:

```
>>> target_shape = (1000000, 1)
>>> np.random.seed(42)  
>>> rand_price = np.random.randint(8, 12, size=target_shape)  
>>> size = np.full(target_shape, np.nan)
>>> size[0] = np.inf
>>> size[-1] = -np.inf

>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=target_shape,
...     group_lens=np.array([1]),
...     price=rand_price,
...     size=size,
...     max_order_records=2  
... )
>>> print_orders(target_shape, sim_out.order_records)
   Order Id  Column  Timestamp  Size  Price  Fees  Side
0         0       0          0  10.0   10.0   0.0   Buy
1         1       0     999999  20.0    8.0   0.0  Sell

```

Exceeding this limit will throw an error:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=target_shape,
...     group_lens=np.array([1]),
...     price=rand_price,
...     size=size,
...     max_order_records=1  
... )
IndexError: order_records index out of range. Set a higher max_order_records.

```

We can also completely disable filling order records by setting `max_order_records` to zero:

```
>>> sim_out = vbt.pf_nb.from_orders_nb(
...     target_shape=target_shape,
...     group_lens=np.array([1]),
...     price=rand_price,
...     size=size,
...     max_order_records=0
... )
>>> print_orders(target_shape, sim_out.order_records)
Empty DataFrame
Columns: [Order Id, Column, Timestamp, Size, Price, Fees, Side]
Index: []

```

Note

`max_order_records` and `max_log_records` are effective for each column. If one column expects to generate 2 records and another one to generate 1000 records, you must use the value of 1000. Also, don't reduce the maximum number of log records (apart from setting it to zero) since logs are generated at each single timestamp.

### Jitting[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#jitting "Permanent link")

Every simulation function, including [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb), is registered as a jittable function in [JITRegistry](https://vectorbt.pro/pvt_40509f46/api/registries/jit_registry/#vectorbtpro.registries.jit_registry.JITRegistry) once vectorbt is imported. The so-called "jitable setup" resulting from the registration contains various information on compilation and decoration, such as what arguments were passed to the Numba's `@njit` decorator. At any point in time, we can instruct the registry to redecorate the function by keeping other decoration arguments at their defaults. For example, to disable Numba and run the simulator as a regular Python function:

```
>>> f_py = vbt.jit_reg.resolve_option(
...     task_id=vbt.pf_nb.from_orders_nb, 
...     option=False  
... )

```

To disable caching:

```
>>> f_no_cache = vbt.jit_reg.resolve_option(
...     task_id=vbt.pf_nb.from_orders_nb, 
...     option=dict(cache=False)
... )

```

To enable automatic parallelization:

```
>>> f_parallel = vbt.jit_reg.resolve_option(
...     task_id=vbt.pf_nb.from_orders_nb, 
...     option=dict(parallel=True)
... )

```

Hint

All the returned functions can be used exactly the same way as `from_orders_nb`. The two latter functions can also be called from within Numba.

### Chunking[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#chunking "Permanent link")

The same goes for chunking: each simulation function is registered as a chunkable function in [ChunkableRegistry](https://vectorbt.pro/pvt_40509f46/api/registries/ch_registry/#vectorbtpro.registries.ch_registry.ChunkableRegistry) and all arguments in [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb) are perfectly chunkable across **groups** (not rows or columns!). But since Numba-compiled functions are meant to be used by other Numba-compiled functions and Numba can't take regular Python functions, they haven't been decorated with the [chunked](https://vectorbt.pro/pvt_40509f46/api/utils/chunking/#vectorbtpro.utils.chunking.chunked) decorator just yet. To decorate, we need to explicitly tell the registry to do so:

```
>>> f_chunked = vbt.ch_reg.resolve_option(
...     setup_id_or_func=vbt.pf_nb.from_orders_nb, 
...     option=True  
... )
>>> print(vbt.prettify(f_chunked.options))
Config(
    n_chunks=None,
    size=ArraySizer(
        arg_query='group_lens',
        single_type=None,
        axis=0
    ),
    min_size=None,
    chunk_len=None,
    chunk_meta=None,
    skip_single_chunk=None,
    arg_take_spec={...},
    template_context=None,
    engine=None,
    engine_config={},
    merge_func=<function merge_sim_outs at 0x7f88873f1ea0>,
    merge_kwargs={...},
    return_raw_chunks=False,
    silence_warnings=None,
    disable=None
)

```

Hint

The returned function can be used the same way as `from_orders_nb`, but not within Numba since it's now wrapped with a regular Python function that takes care of chunking.

Let's go all into BTC and ETH while utilizing chunking, which will produce two totally-isolated simulations. Internally, this will split `group_lens` into two arrays (`[1]` and `[1]`), then split each argument value into chunks such that each chunk contains information only about one of the groups, execute the same function but on different chunks using [Dask](https://dask.org/), and finally, merge the results of both simulations as if they were produced by a single, monolithic simulation ![🪄](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1fa84.svg ":magic_wand:")

```
>>> sim_out = f_chunked(
...     target_shape=mult_symbol_wrapper.shape_2d,
...     group_lens=np.array([1, 1]),
...     close=mult_data.get("Close").values,
...     _n_chunks=2,  
...     _execute_kwargs=dict(engine="dask")
... )
>>> print_orders(mult_symbol_wrapper.shape_2d, sim_out.order_records)
   Order Id  Column  Timestamp      Size        Price  Fees Side
0         0       0          0  0.013999  7143.580078   0.0  Buy
1         0       1          0  0.311639   320.884003   0.0  Buy

```

Chunking even knows how to split flexible arrays!

## Class method[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#class-method "Permanent link")

Often, using the Numba-compiled simulation function directly is quite cumbersome, given that many of our inputs are either scalars or Pandas objects that would have to be converted to NumPy arrays. Nevertheless, knowing how inputs are processed at the most fundamental level is very important for understanding how vectorbt works under the hood. To add another level of abstraction and to assist the user, vectorbt enhances each simulation function by wrapping it with a class method, such as [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders) for [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb), that automates some input pre-processing and output post-processing.

For example, here's how easy it is to test the three orders we mentioned at the beginning:

```
>>> pf = vbt.Portfolio.from_orders(
...     close=[11, 10, 12],
...     size=[0.1, -0.1, np.nan]
... )
>>> pf.orders.readable
   Order Id  Column  Timestamp  Size  Price  Fees  Side
0         0       0          0   0.1   11.0   0.0   Buy
1         1       0          1   0.1   10.0   0.0  Sell

```

But probably the simplest example involves just a single order (for $10, buy 1 share):

```
>>> pf = vbt.Portfolio.from_orders(10, 1)  
>>> pf.orders.readable
   Order Id  Column  Timestamp  Size  Price  Fees Side
0         0       0          0   1.0   10.0   0.0  Buy

```

Each class method is basically a small pipeline that pulls default argument values from global settings, broadcasts arguments, checks whether arguments have correct data types, redecorates the simulation function by resolving jitting and chunking options, runs the simulation, and, finally, creates a new [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) instance based on the result of the simulation and ready to be analyzed. But the most important: it makes use of Pandas, including datetime indexes and column hierarchies - nobody wants to work with NumPy arrays alone!

### Close price[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#close-price "Permanent link")

In contrast to their Numba-compiled functions, the class methods require the close price to be provided. This requirement is associated with the post-analysis phase: many metrics and time series such as the equity curve can only be reliably calculated using the latest price at each bar since they use information that happens somewhere during that bar, and we should avoid looking into the future by using the open price or any other intermediate data.

### Defaults[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#defaults "Permanent link")

If we look at the signature of [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders), we would notice an exceptionally high amount of `None` values. The value `None` has a special meaning and usually instructs vectorbt to replace it with the respective default value from the global settings.

```
>>> vbt.phelp(vbt.Portfolio.from_orders, incl_doc=False)
Portfolio.from_orders(
    close,
    size=None,
    size_type=None,
    direction=None,
    price=None,
    fees=None,
    ...
    jitted=None,
    chunked=None,
    wrapper_kwargs=None,
    freq=None,
    bm_close=None,
    **kwargs
)

```

The global settings for [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) are stored in the config [settings.portfolio](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.portfolio). For example, by default, vectorbt uses the close price as the order price (remember how the negative infinity means the open price and the positive infinity means the close price?):

```
>>> vbt.settings.portfolio["price"]
inf

```

To change a default, we can override it directly in the settings. For example, let's introduce a fixed commission of $1 to every order:

```
>>> vbt.settings.portfolio["fixed_fees"] = 1

>>> pf = vbt.Portfolio.from_orders(
...     close=pd.Series([11, 10, 12]),
...     size=pd.Series([0.1, -0.1, np.nan])
... )
>>> pf.orders.readable
   Order Id  Column  Timestamp  Size  Price  Fees  Side
0         0       0          0   0.1   11.0   1.0   Buy
1         1       0          1   0.1   10.0   1.0  Sell
                                               ^
                                              here

```

The settings can be reset as any other [config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config):

```
>>> vbt.settings.portfolio.reset()

>>> vbt.settings.portfolio["fixed_fees"]
0.0

```

Generally, global defaults follow the same schema as keyword arguments across most simulation functions. For example, `price` defaults to `np.array(np.inf)` just about everywhere in Numba. If you cannot find an argument in the global settings, then there is no default value for that argument and `None` is a legitimate value.

### Enums[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#enums "Permanent link")

In the vectorbt's ecosystem, we can find a lot of arguments of an enumerated type. Enums are regular integers that act as categorical variables. Similarly to contexts, they are also represented by a named tuple, but this tuple is already initialized with values usually ranging from 0 to the total number of categories in the enum. Let's take the [SizeType](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SizeType) as an example:

```
>>> print(vbt.prettify(vbt.pf_enums.SizeType))
SizeTypeT(
    Amount=0,
    Value=1,
    Percent=2,
    TargetAmount=3,
    TargetValue=4,
    TargetPercent=5
)

```

Instead of requiring the user to pass any value as an integer, we can take the name of its field instead and convert it to an integer using [map\_enum\_fields](https://vectorbt.pro/pvt_40509f46/api/utils/enum_/#vectorbtpro.utils.enum_.map_enum_fields), which takes the field name and the enumerated type, and returns the value of that field in that type. In addition, it allows us to convert entire collections of fields, such as lists and Pandas objects.

```
>>> vbt.map_enum_fields("targetamount", vbt.pf_enums.SizeType)
3

>>> vbt.map_enum_fields([
...     "amount",
...     "targetamount",
...     "targetpercent"
... ], vbt.pf_enums.SizeType)
[0, 3, 5]

```

Internally, this function uses [apply\_mapping](https://vectorbt.pro/pvt_40509f46/api/utils/mapping/#vectorbtpro.utils.mapping.apply_mapping), which enables many useful options, such as ignoring the input if it's already of an integer data type:

```
>>> vbt.map_enum_fields(3, vbt.pf_enums.SizeType)
3

```

Also, by default, it ignores the case and removes all non-alphanumeric characters:

```
>>> vbt.map_enum_fields("Target Amount", vbt.pf_enums.SizeType)
3

```

And that's all the magic behind [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders) and other simulation methods knowing how to handle string options! Let's enter a position of one share at one bar and then sell 50% of it at the next bar:

```
>>> pf = vbt.Portfolio.from_orders(
...     close=pd.Series([10, 11]),
...     size=pd.Series([1, -0.5]),
...     size_type=pd.Series(["amount", "percent"]),
...     direction="longonly"
... )
>>> pf.orders.readable
   Order Id  Column  Timestamp  Size  Price  Fees  Side
0         0       0          0   1.0   10.0   0.0   Buy
1         1       0          1   0.5   11.0   0.0  Sell

```

Note

Conversion isn't vectorized - it's advisable to provide actual integers when bigger arrays are involved to avoid performance penalties.

### Broadcasting[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#broadcasting "Permanent link")

Once the argument values have been resolved, vectorbt takes all the arguments that should broadcast against the target shape, and passes them to the function [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast).

Broadcasting is one of the most essential building blocks in vectorbt because it allows us to provide arrays with various shapes and types, including NumPy arrays, Pandas Series and DataFrames, and even regular lists. Whenever we iterate over rows (timestamps) and columns (assets), the simulator needs to know which element in each array currently to pick. Instead of providing huge arrays where each element is set, we can pass some arrays with elements per row, some with elements per column, and some as scalars, and the vectorbt's broadcaster will make sure that they perfectly align with the target shape over which the simulator iterates.

Let's broadcast some arrays manually. Here, we have one column in the price array and want to test multiple combinations of order size by making it a DataFrame with one row and multiple columns:

```
>>> close = pd.Series(
...     [11, 10, 12], 
...     index=vbt.date_range("2020-01-01", periods=3)
... )
>>> size = pd.DataFrame(
...     [[-np.inf, np.nan, np.inf]],
...     columns=pd.Index(["short", "nan", "long"], name="size")
... )
>>> fees = 0.01

>>> broadcasted = vbt.broadcast(dict(
...     close=close,
...     size=size,
...     fees=0.01
... ))
>>> broadcasted["close"]
size        short  nan  long
2020-01-01     11   11    11
2020-01-02     10   10    10
2020-01-03     12   12    12

>>> broadcasted["size"]
size        short  nan  long
2020-01-01   -inf  NaN   inf
2020-01-02   -inf  NaN   inf
2020-01-03   -inf  NaN   inf

>>> broadcasted["fees"]
size        short   nan  long
2020-01-01   0.01  0.01  0.01
2020-01-02   0.01  0.01  0.01
2020-01-03   0.01  0.01  0.01

```

But thanks to flexible indexing, we don't have to bring each argument to the full shape and materialize it. That's why, to avoid high memory consumption, each simulation method also passes `keep_flex=True` to the broadcaster to keep all arguments in their original form suitable for flexible indexing. For them, the broadcaster will only check whether they **can broadcast** to the final shape. Since we not only broadcast NumPy arrays but also Pandas objects as well, we need to return the wrapper resulting from the broadcasting operation, which will contain the final shape and Pandas metadata including the index and columns:

```
>>> broadcasted, wrapper = vbt.broadcast(dict(
...     close=close,
...     size=size,
...     fees=0.01
... ), keep_flex=True, return_wrapper=True)
>>> broadcasted["close"]
[[11]
 [10]
 [12]]

>>> broadcasted["size"]
[[-inf  nan  inf]]

>>> broadcasted["fees"]
[0.01]

>>> wrapper.fill()  
size        short  nan  long
2020-01-01    NaN  NaN   NaN
2020-01-02    NaN  NaN   NaN
2020-01-03    NaN  NaN   NaN

```

Hint

Even though we passed `fees` as a scalar, the broadcaster automatically wrapped it with a NumPy array and expanded to two dimensions for Numba. For the same reason, it also converted Pandas to NumPy.

Some arrays, such as `init_cash` and `cash_deposits`, cannot broadcast together with `close` because their final shape depends on the number of groups, or they are one-dimensional by nature. Thus, after all the regular arrays were aligned, the wrapper was created, and the target shape was established, vectorbt will first create the group lengths array, and then individually broadcast all the arrays that aren't broadcastable against `target_shape`. For example, to broadcast the initial position array:

```
>>> init_position = 1
>>> new_init_position = vbt.broadcast_array_to(init_position, wrapper.shape_2d[1])
>>> new_init_position
array([1, 1, 1])

```

All of this is conveniently done by [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders)!

```
>>> pf = vbt.Portfolio.from_orders(
...     close=close,
...     size=size,
...     fees=fees,
...     init_position=init_position
... )
>>> pf.orders.readable
   Order Id Column  Timestamp       Size  Price      Fees  Side
0         0  short 2020-01-01  10.981098   11.0  1.207921  Sell
1         0   long 2020-01-01   9.000900   11.0  0.990099   Buy

>>> pf.value
size             short    nan        long
2020-01-01  109.792079  111.0  110.009901
2020-01-02  119.773177  110.0  100.009001
2020-01-03   99.810981  112.0  120.010801

```

To control the broadcasting process, we can pass additional arguments to [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast) via `broadcast_kwargs`. For example, let's replace the final columns:

```
>>> pf = vbt.Portfolio.from_orders(
...     close=close,
...     size=size,
...     fees=fees,
...     init_position=init_position,
...     broadcast_kwargs=dict(columns_from=["a", "b", "c"])
... )
>>> pf.value
                     a      b           c
2020-01-01  109.792079  111.0  110.009901
2020-01-02  119.773177  110.0  100.009001
2020-01-03   99.810981  112.0  120.010801

```

We can also wrap any argument with the class [BCO](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.BCO) to provide broadcasting-related keyword arguments just for that particular object, or with the class [Param](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.Param) to mark the object as a parameter. Below, we are testing the Cartesian product of two parameters: size and fees.

```
>>> pf = vbt.Portfolio.from_orders(
...     close=close,
...     size=vbt.Param([-np.inf, np.inf]),  
...     fees=vbt.Param([0, 0.01]),
...     init_position=init_position
... )
>>> pf.value
size                          -inf                     inf            
fees              0.00        0.01        0.00        0.01
2020-01-01  111.000000  109.792079  111.000000  110.009901
2020-01-02  121.090909  119.773177  100.909091  100.009001
2020-01-03  100.909091   99.810981  121.090909  120.010801

```

Furthermore, we can broadcast differently-shaped Pandas DataFrames if their column levels overlap. Let's say we have two assets, and we want to test the open and close price as the order price. For this, we need to create a Pandas DataFrame for the order price that has 4 columns, each price type per each asset:

```
>>> mult_close = mult_data.get("Close")
>>> mult_close
symbol                          BTC-USD      ETH-USD
Date                                                
2017-11-09 00:00:00+00:00   7143.580078   320.884003
2017-11-10 00:00:00+00:00   6618.140137   299.252991
2017-11-11 00:00:00+00:00   6357.600098   314.681000
...                                 ...          ...
2021-12-29 00:00:00+00:00  46444.710938  3628.531738
2021-12-30 00:00:00+00:00  47178.125000  3713.852051
2021-12-31 00:00:00+00:00  46306.445312  3682.632812

[1514 rows x 2 columns]

>>> mult_price = pd.concat((
...     mult_data.get("Open"), 
...     mult_data.get("Close")
... ), axis=1, keys=pd.Index(["open", "close"], name="price"))
>>> mult_price
price                              open                      close  \
symbol                          BTC-USD      ETH-USD       BTC-USD   
Date                                                                 
2017-11-09 00:00:00+00:00   7446.830078   308.644989   7143.580078   
2017-11-10 00:00:00+00:00   7173.729980   320.670990   6618.140137   
2017-11-11 00:00:00+00:00   6618.609863   298.585999   6357.600098   
...                                 ...          ...           ...   
2021-12-29 00:00:00+00:00  47623.871094  3797.436279  46444.710938   
2021-12-30 00:00:00+00:00  46490.605469  3632.219727  47178.125000   
2021-12-31 00:00:00+00:00  47169.371094  3713.430176  46306.445312   

price                                   
symbol                         ETH-USD  
Date                                    
2017-11-09 00:00:00+00:00   320.884003  
2017-11-10 00:00:00+00:00   299.252991  
2017-11-11 00:00:00+00:00   314.681000  
...                                ...  
2021-12-29 00:00:00+00:00  3628.531738  
2021-12-30 00:00:00+00:00  3713.852051  
2021-12-31 00:00:00+00:00  3682.632812  

[1514 rows x 4 columns]

```

Even though both shapes (1524, 2) and (1524, 4) are [not broadcastable](https://numpy.org/doc/stable/user/basics.broadcasting.html) (!) in NumPy, vectorbt identifies that both DataFrames share the same column level `symbol`, and aligns them based on that level using [align\_pd\_arrays](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.align_pd_arrays), which then yields a successful simulation:

```
>>> pf = vbt.Portfolio.from_orders(close=mult_close, price=mult_price)
>>> pf.value
price                            open                    close             
symbol                        BTC-USD      ETH-USD     BTC-USD      ETH-USD
Date                                                                       
2017-11-09 00:00:00+00:00   95.927798   103.965402  100.000000   100.000000
2017-11-10 00:00:00+00:00   88.871910    96.957022   92.644585    93.258931
2017-11-11 00:00:00+00:00   85.373240   101.955648   88.997394    98.066902
...                               ...          ...         ...          ...
2021-12-29 00:00:00+00:00  623.684312  1175.632804  650.160150  1130.792345
2021-12-30 00:00:00+00:00  633.532987  1203.276315  660.426908  1157.381490
2021-12-31 00:00:00+00:00  621.827608  1193.161381  648.224627  1147.652355

[1514 rows x 4 columns]

```

Info

See the API documentation of [broadcast](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.reshaping.broadcast) for more examples on broadcasting.

Even though [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders) is the most basic simulation method, it already takes dozens of broadcastable array-like arguments. So, how do we know exactly which argument is broadcastable?

To see which arguments can broadcast, take a look either at the API documentation of the argument, or at the annotation of the argument in the source code, which has the type `ArrayLike` when it can be provided both as a scalar and as an array. You can also look at the argument annotations of the Numba-compiled simulation function (here [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb)) and search for the prefix `FlexArray`. Finally, the last and probably the least underrated method is to look at the argument taking specification of the chunking decorator: arguments that are chunked using [FlexArraySlicer](https://vectorbt.pro/pvt_40509f46/api/base/chunking/#vectorbtpro.base.chunking.FlexArraySlicer) or have `flex` in the specification name are broadcastable by nature. The specification also reveals against what shape the argument should broadcast.

```
>>> print(vbt.prettify(f_chunked.options["arg_take_spec"]["close"]))
FlexArraySlicer(
    single_type=None,
    ignore_none=True,
    mapper={
        'should_cache': True,
        'chunk_meta_cache': {...},
        'arg_query': {
            'pattern': '(group_lens|group_map)',
            'flags': 0
        }
    },
    axis=1
)

```

Here, the argument `close` is expected as a flexible array that is chunked along the column axis using the group lengths mapper. Since the simulation function is always chunked by its groups and columns of this argument are mapped to those groups, it should broadcast along columns in `target_shape` as opposed to groups in `group_lens`. Arguments that have no mapper, such as `cash_deposits`, always broadcast along groups:

```
>>> print(vbt.prettify(f_chunked.options["arg_take_spec"]["cash_deposits"]))
FlexArraySlicer(
    single_type=None,
    ignore_none=True,
    mapper=None,
    axis=1
)

```

Hint

As a rule of thumb: if you take a look at the source code of [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb), only the arguments that have `portfolio_ch.flex_array_gl_slicer` as their specification broadcast together and build the target shape. All other flexible arguments broadcast individually once the target shape has been built.

### Grouping[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#grouping_1 "Permanent link")

Since the target shape is now being generated from broadcasting instead of being passed manually by the user, there is no possibility for the user to provide the group lengths either. Instead, vectorbt will take a grouping instruction and create this array for us. Grouping is performed by constructing a [Grouper](https://vectorbt.pro/pvt_40509f46/api/base/grouping/base/#vectorbtpro.base.grouping.base.Grouper) instance, which takes the broadcasted columns and a group-by object (`group_by`). It then uses the group-by object to distribute the columns into groups and generate the group lengths array. See the API documentation of [Grouper](https://vectorbt.pro/pvt_40509f46/api/base/grouping/base/#vectorbtpro.base.grouping.base.Grouper) to learn about various group-by options. For example, we can pass `group_by=True` to put all columns into a single group, or specify the column level by which the columns should be grouped.

And even though [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb) automatically turns on cash sharing whenever it discovers multiple columns in a group, we must explicitly enable cash sharing with `cash_sharing` in the class method, otherwise no grouping during the simulation will be performed! This is because a [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) instance can also group its columns during the post-analysis phase, and `cash_sharing` is a special flag that tells vectorbt to perform the grouping during the simulation as well.

Let's demonstrate what it's like to invest all the initial cash into two assets without grouping, with grouping, and with grouping and cash sharing:

```
>>> pf = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close")
... )
>>> pf.value  
symbol                        BTC-USD      ETH-USD
Date                                              
2017-11-09 00:00:00+00:00  100.000000   100.000000
2017-11-10 00:00:00+00:00   92.644585    93.258931
2017-11-11 00:00:00+00:00   88.997394    98.066902
...                               ...          ...
2021-12-29 00:00:00+00:00  650.160150  1130.792345
2021-12-30 00:00:00+00:00  660.426908  1157.381490
2021-12-31 00:00:00+00:00  648.224627  1147.652355

[1514 rows x 2 columns]

>>> pf = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close"),
...     group_by=True
... )
>>> pf.value  
Date
2017-11-09 00:00:00+00:00     200.000000
2017-11-10 00:00:00+00:00     185.903516
2017-11-11 00:00:00+00:00     187.064296
...                                  ...
2021-12-29 00:00:00+00:00    1780.952495
2021-12-30 00:00:00+00:00    1817.808397
2021-12-31 00:00:00+00:00    1795.876982
Freq: D, Name: group, Length: 1514, dtype: float64

>>> pf = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close"),
...     group_by=True,
...     cash_sharing=True
... )
>>> pf.value  
Date
2017-11-09 00:00:00+00:00    100.000000
2017-11-10 00:00:00+00:00     92.644585
2017-11-11 00:00:00+00:00     88.997394
...                                 ...
2021-12-29 00:00:00+00:00    650.160150
2021-12-30 00:00:00+00:00    660.426908
2021-12-31 00:00:00+00:00    648.224627
Freq: D, Name: group, Length: 1514, dtype: float64

```

Passing `group_by=True` only works when all columns are different assets and there are no parameter combinations. But how about multiple assets and parameter combinations?

Let's play with different group-by instructions on the `mult_close` and `mult_price` arrays that we constructed earlier. The final broadcasted shape has 4 columns: each price type per each asset. What we want to do is to create two groups by putting the assets of each parameter combination into a single basket. We cannot pass `group_by=True` because it will combine all 4 columns. We also cannot pass the column level `symbol` as `group_by` because it will group by asset, that is, it will put the columns with `BTC-USD`, such as `(Open, BTC-USD)` and `(Close, BTC-USD)`, into one group and the columns with `ETH-USD` into another. What we need though is to put `(Open, BTC-USD)` and `(Open, ETH-USD)` into one group and `(Close, BTC-USD)` and `(Close, ETH-USD)` into another; that is, we need to pass all the column levels **apart from symbols** as `group_by`, which can be done in multiple ways:

```
>>> pf = vbt.Portfolio.from_orders(
...     close=mult_close, 
...     price=mult_price,
...     group_by=pd.Index(["group1", "group1", "group2", "group2"])  
... )
>>> pf.value
                                group1       group2
Date                                               
2017-11-09 00:00:00+00:00   199.893199   200.000000
2017-11-10 00:00:00+00:00   185.828932   185.903516
2017-11-11 00:00:00+00:00   187.328888   187.064296
...                                ...          ...
2021-12-29 00:00:00+00:00  1799.317116  1780.952495
2021-12-30 00:00:00+00:00  1836.809302  1817.808397
2021-12-31 00:00:00+00:00  1814.988988  1795.876982

[1514 rows x 2 columns]

>>> pf = vbt.Portfolio.from_orders(
...     close=mult_close, 
...     price=mult_price,
...     group_by=["price"]  
... )
>>> pf.value
price                             open        close
Date                                               
2017-11-09 00:00:00+00:00   199.893199   200.000000
2017-11-10 00:00:00+00:00   185.828932   185.903516
2017-11-11 00:00:00+00:00   187.328888   187.064296
...                                ...          ...
2021-12-29 00:00:00+00:00  1799.317116  1780.952495
2021-12-30 00:00:00+00:00  1836.809302  1817.808397
2021-12-31 00:00:00+00:00  1814.988988  1795.876982

[1514 rows x 2 columns]

>>> pf = vbt.Portfolio.from_orders(
...     close=mult_close, 
...     price=mult_price,
...     group_by=vbt.ExceptLevel("symbol")  
... )
>>> pf.value
price                             open        close
Date                                               
2017-11-09 00:00:00+00:00   199.893199   200.000000
2017-11-10 00:00:00+00:00   185.828932   185.903516
2017-11-11 00:00:00+00:00   187.328888   187.064296
...                                ...          ...
2021-12-29 00:00:00+00:00  1799.317116  1780.952495
2021-12-30 00:00:00+00:00  1836.809302  1817.808397
2021-12-31 00:00:00+00:00  1814.988988  1795.876982

```

Important

To make sure that the grouping operation on assets was successful, the final column hierarchy should include all columns levels except the one with asset symbols. For example, passing `group_by=True` will hide all columns levels, while passing `group_by='symbol'` will show only the column level with asset symbols ![❌](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/274c.svg ":x:")

### Call sequence[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#call-sequence_1 "Permanent link")

Similarly to grouping, the class method also simplifies handling of call sequences. There is an argument `call_seq` that not only accepts a (broadcastable) array, but can also be provided as a value of the enum [CallSeqType](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.CallSeqType). For example, we can pass "auto" to sort the call sequence automatically and to first execute the assets that should be sold before executing the assets that should be bought, which is an important requirement for rebalancing. Let's create an equally-weighted portfolio that is being rebalanced every month:

```
>>> size = mult_symbol_wrapper.fill(np.nan)
>>> size.vbt.set(0.5, every="M", inplace=True)
>>> size.iloc[0] = 0.5

>>> pf = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close"), 
...     size=size,
...     size_type="targetpercent",
...     group_by=vbt.ExceptLevel("symbol"),
...     cash_sharing=True,
...     call_seq="auto"
... )
>>> allocations = pf.get_asset_value(group_by=False).vbt / pf.value
>>> allocations.vbt.plot(  
...    trace_kwargs=dict(stackgroup="one"),
...    use_gl=False
... ).show()

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/pf/from_orders_call_seq.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/pf/from_orders_call_seq.dark.svg#only-dark)

To access the sorted call sequence after the simulation, we can pass `attach_call_seq` and then read the property [Portfolio.call\_seq](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.call_seq):

```
>>> pf = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close"), 
...     size=size,
...     size_type="targetpercent",
...     group_by=vbt.ExceptLevel("symbol"),
...     cash_sharing=True,
...     call_seq="auto",
...     attach_call_seq=True  
... )
>>> pf.call_seq
symbol                     BTC-USD  ETH-USD
Date                                       
2017-11-09 00:00:00+00:00        0        1
2017-11-10 00:00:00+00:00        1        0
2017-11-11 00:00:00+00:00        1        0
...                            ...      ...
2021-12-29 00:00:00+00:00        1        0
2021-12-30 00:00:00+00:00        1        0
2021-12-31 00:00:00+00:00        1        0

[1514 rows x 2 columns]

```

### Unlimited cash[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#unlimited-cash "Permanent link")

When testing many trading strategies and parameter combinations, cash may quickly become a bottleneck. Also, determining the right amount of starting capital is often a challenge by itself. Gladly, there is a range of options that help us in backtesting a trading strategy without having to think about cash limits. One common approach is to pass `np.inf` as `init_cash` to simulate an unlimited cash balance. Welcome to the billionaires club ![💸](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f4b8.svg ":money_with_wings:")

But this would drive the post-analysis havoc because the portfolio value at each timestamp would be infinite as well. To account for this, we can instruct vectorbt to simulate an unlimited cash balance during the simulation, and then post-analyze the expenditures to determine the optimal starting capital. If wanted, we can then re-run the simulation but with the calculated optimal amount. To make this possible, we can pass one of the options from [InitCashMode](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.InitCashMode) as `init_cash`. As opposed to other enums, this enum contains only negative values such that they cannot be confused with zero or positive amounts.

Important

During the simulation, each group value will be infinity. Thus, we cannot use the size of (+/-) infinity, but also percentages, target percentages, and other size types that depend on the group value. We also cannot fill returns during the simulation.

Let's [DCA](https://www.investopedia.com/terms/d/dollarcostaveraging.asp) into BTC and ETH by buying one unit each year, and then, retrospectively, find out how much capital this activity would require:

```
>>> size = mult_symbol_wrapper.fill(np.nan)
>>> size.vbt.set(1, every="Y", inplace=True)
>>> size.iloc[0] = 1

>>> pf = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close"), 
...     size=size,
...     init_cash="auto"  
... )
>>> pf.init_cash  
symbol
BTC-USD    61218.626953
ETH-USD     2095.513962
Name: init_cash, dtype: float64

```

We can then pass these amounts to a new simulation if desired:

```
>>> pf2 = vbt.Portfolio.from_orders(
...     close=mult_data.get("Close"), 
...     size=size,
...     init_cash=pf.init_cash
... )
>>> pf2.cash.loc[~size.isnull().all(axis=1)]  
symbol                          BTC-USD      ETH-USD
Date                                                
2017-11-09 00:00:00+00:00  54075.046875  1774.629959
2018-01-01 00:00:00+00:00  40417.846680  1001.988968
2019-01-01 00:00:00+00:00  36574.326660   861.169556
2020-01-01 00:00:00+00:00  29374.152344   730.367554
2021-01-01 00:00:00+00:00      0.000000     0.000000

```

We can see how each investment gradually reduces the cash balance and how the final investment drains it completely, while still enabling us to order exactly one unit of each cryptocurrency:

```
>>> pf2.orders.readable
   Order Id   Column                 Timestamp  Size         Price  Fees Side
0         0  BTC-USD 2017-11-09 00:00:00+00:00   1.0   7143.580078   0.0  Buy
1         1  BTC-USD 2018-01-01 00:00:00+00:00   1.0  13657.200195   0.0  Buy
2         2  BTC-USD 2019-01-01 00:00:00+00:00   1.0   3843.520020   0.0  Buy
3         3  BTC-USD 2020-01-01 00:00:00+00:00   1.0   7200.174316   0.0  Buy
4         4  BTC-USD 2021-01-01 00:00:00+00:00   1.0  29374.152344   0.0  Buy
5         0  ETH-USD 2017-11-09 00:00:00+00:00   1.0    320.884003   0.0  Buy
6         1  ETH-USD 2018-01-01 00:00:00+00:00   1.0    772.640991   0.0  Buy
7         2  ETH-USD 2019-01-01 00:00:00+00:00   1.0    140.819412   0.0  Buy
8         3  ETH-USD 2020-01-01 00:00:00+00:00   1.0    130.802002   0.0  Buy
9         4  ETH-USD 2021-01-01 00:00:00+00:00   1.0    730.367554   0.0  Buy

```

### Output arrays[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#output-arrays "Permanent link")

All the arrays that are returned as part of [SimulationOutput](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.SimulationOutput), such as `cash_deposits`, `cash_earnings`, and `in_outputs.returns`, can be accessed as an attribute with the same name of a [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) instance. Let's do the same example as we did in [Cash deposits](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#cash-deposits):

```
>>> size = symbol_wrapper.fill(np.nan)
>>> size.vbt.set(-0.1, every="Y", inplace=True)

>>> pf = vbt.Portfolio.from_orders(
...     close=data.get("Close"),
...     size=size,
...     size_type="percent",
...     direction="longonly",
...     init_position=1,
...     cash_deposits=-np.inf
... )
>>> pf.cash_deposits[pf.cash_deposits != 0]
Date
2014-09-17 00:00:00+00:00    -100.000000
2015-01-02 00:00:00+00:00     -31.424899
2016-01-02 00:00:00+00:00     -39.090061
2017-01-02 00:00:00+00:00     -80.864326
2018-01-02 00:00:00+00:00    -995.609894
2019-01-02 00:00:00+00:00    -252.173348
2020-01-02 00:00:00+00:00    -425.163093
2021-01-02 00:00:00+00:00   -1561.062890
dtype: float64

```

### Max record count[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#max-record-count_1 "Permanent link")

Another automation brought by [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders) is touching the maximum number of order and log records. Whenever we pass `None`, [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb) will pick the maximum possible number of records. In the class method though, vectorbt will check how many non-NaN values there are in the size array, and will pick the highest number across all columns. The same goes for logs, where it determines the number of `True` values. This has almost no impact on performance because vectorbt doesn't need to fully broadcast both arrays to get these numbers. Thus, we don't have to provide `max_order_records` and `max_log_records` if we decide to represent inactive data points as NaN in a huge close array.

### Data type checks[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#data-type-checks "Permanent link")

Numba is the closest thing to a statically-typed code in vectorbt, and directly passing wrong data types to Numba usually leads to an ugly-formatted exception. To provide us with a bit of help in debugging, vectorbt checks all data types prior to calling [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb).

```
>>> vbt.Portfolio.from_orders(True)
AssertionError: Data type of 'close' must be <class 'numpy.number'>, not bool

```

Here, the argument `close` seems to require a numeric data type ![😌](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f60c.svg ":relieved:")

Note

In vectorbt, almost no function will change the data type of an array in a hidden manner because casting may be quite expensive in performance terms, especially when huge arrays are involved. It's the responsibility of the user to supply properly typed and sized data!

### Jitting[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#jitting_1 "Permanent link")

Remember how we resolved various jitting options to redecorate [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb)? Just like everywhere in vectorbt, in the class method a jitting option can be provided using the argument `jitted`. Let's test a random simulation without and with automatic parallelization with Numba:

```
>>> big_target_shape = (1000, 1000)
>>> big_rand_price = np.random.randint(8, 12, size=big_target_shape)
>>> big_size = np.full(big_target_shape, 1)
>>> big_size[1::2] = -1

```

```
>>> %%timeit
>>> vbt.Portfolio.from_orders(
...     close=big_rand_price, 
...     size=big_size
... )
113 ms ± 2.34 ms per loop (mean ± std. dev. of 7 runs, 10 loops each)

```

```
>>> %%timeit
>>> vbt.Portfolio.from_orders(
...     close=big_rand_price, 
...     size=big_size,
...     jitted=dict(parallel=True)
... )
97 ms ± 3.47 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)

```

Info

Preset simulators like [from\_orders\_nb](https://vectorbt.pro/pvt_40509f46/api/portfolio/nb/from_orders/#vectorbtpro.portfolio.nb.from_orders.from_orders_nb) can only be parallelized along groups and columns, thus it would make no difference in enabling the parallel mode when there is only one group or column present. But also, it's usually a better idea to use chunking for parallelization as Numba may yield no performance benefit at all. Only certain user-crafted pipelines that make heavy use of math can be parallelized well with Numba.

### Chunking[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#chunking_1 "Permanent link")

Similarly to a jitting option, chunking can be enabled by providing an option via the argument `chunked`. Below, we do the same benchmark as above but now using Dask:

```
>>> %%timeit
>>> vbt.Portfolio.from_orders(
...     close=big_rand_price, 
...     size=big_size,
...     chunked=dict(engine="dask", n_chunks=4)
... )
67.2 ms ± 3.63 ms per loop (mean ± std. dev. of 7 runs, 10 loops each)

```

Info

Multithreading with Dask is better suited for this job than multiprocessing with Ray because, by default, all Numba-compiled functions in vectorbt release the [GIL](https://realpython.com/python-gil/), and there is a much smaller overhead when starting multiple threads than processes. Consider using multiprocessing when the function takes a considerable amount of time to run.

### Use cases[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#use-cases "Permanent link")

This method is best suited for backtesting jobs where order information is known beforehand and there is no order that changes its parameters depending on changes in the environment. That is, we cannot implement SL, TP, limit, or any other complex order type using this method. It's really just a smart way of representing multiple instances of [Order](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.Order) in a vectorized and resource-cheap way - imagine how difficult it would be to supply a list of named tuples instead of arrays! There are two particular use cases where [Portfolio.from\_orders](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.from_orders) becomes interesting: portfolio rebalancing with predefined weights, and "what-if" analysis. While we've already touched rebalancing more than enough times, the latter use case is about simulating and analyzing various hypothetical scenarios of a real-world trading activity.

Let's say we have made 3 trades on SOL/BTC on Binance and want to analyze them in depth. Even if Binance has made some improvements in its trade analysis capabilities, doing it with vectorbt opens an entirely new dimension. First, we need to pull the close price of a granularity with which we would like the trades to be analyzed. Then, we need to convert trade information into orders. Finally, we can use [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) to see how the portfolio evolved over time!

```
>>> trade1 = dict(
...     timestamp="2022-01-22 12:39:26",
...     price=0.0027702,
...     size=4.99,
...     fixed_fees=1.01571e-05  
... )
>>> trade2 = dict(
...     timestamp="2022-01-29 02:12:50",
...     price=0.00243,
...     size=-1.72,
...     fixed_fees=3.0549e-06
... )
>>> trade3 = dict(
...     timestamp="2022-01-29 02:52:54",
...     price=0.0024299,
...     size=-3.27,
...     fixed_fees=5.8102e-06
... )

>>> trades = pd.DataFrame([trade1, trade2, trade3])  
>>> trades["timestamp"] = pd.to_datetime(trades["timestamp"], utc=True)  
>>> trades.set_index("timestamp", inplace=True)
>>> trades
                             price  size  fixed_fees
timestamp                                           
2022-01-22 12:39:26+00:00  0.00277  4.99    0.000010
2022-01-29 02:52:54+00:00  0.00243 -1.72    0.000003
2022-01-29 02:52:54+00:00  0.00243 -3.27    0.000006

>>> solbtc_data = vbt.BinanceData.pull(  
...     "SOLBTC", 
...     start=trades.index[0] - pd.Timedelta(days=1), 
...     end=trades.index[-1] + pd.Timedelta(days=1),
...     timeframe="1h"
... )

>>> resampler = vbt.Resampler(  
...     source_index=trades.index, 
...     target_index=solbtc_data.wrapper.index,
...     source_freq=None,
...     target_freq="1h"
... )

>>> 

>>> @njit
... def avg_price_reduce_meta_nb(from_i, to_i, col, size, price):  
...     _size = size[from_i:to_i, col]
...     _price = price[from_i:to_i, col]
...     return np.sum(_price * _size) / np.sum(_size)

>>> price = pd.Series.vbt.resample_to_index(  
...     resampler, 
...     avg_price_reduce_meta_nb,
...     vbt.to_2d_array(trades["size"]),
...     vbt.to_2d_array(trades["price"]),
...     wrapper=trades["price"].vbt.wrapper,
... )
>>> price.loc[~price.isnull()]  
Open time
2022-01-22 12:00:00+00:00    0.00277
2022-01-29 02:00:00+00:00    0.00243
Freq: 158H, Name: price, dtype: float64

>>> size = trades["size"].vbt.resample_to_index(  
...     resampler, 
...     vbt.nb.sum_reduce_nb
... )
>>> size.loc[~size.isnull()]
Open time
2022-01-22 12:00:00+00:00    4.99
2022-01-29 02:00:00+00:00   -4.99
Freq: 158H, Name: size, dtype: float64

>>> fixed_fees = trades["fixed_fees"].vbt.resample_to_index(
...     resampler, 
...     vbt.nb.sum_reduce_nb
... )
>>> fixed_fees.loc[~fixed_fees.isnull()]
Open time
2022-01-22 12:00:00+00:00    0.000010
2022-01-29 02:00:00+00:00    0.000009
Freq: 158H, Name: fixed_fees, dtype: float64

>>> pf = vbt.Portfolio.from_orders(  
...     open=solbtc_data.get("Open"),
...     high=solbtc_data.get("High"),
...     low=solbtc_data.get("Low"),
...     close=solbtc_data.get("Close"),
...     price=price,
...     size=size,
...     fixed_fees=fixed_fees,
...     init_cash=0.1,
...     ffill_val_price=False,
...     skipna=True
... )
>>> pf.orders.readable  
   Order Id  Column                 Timestamp  Size    Price      Fees  Side
0         0       0 2022-01-22 12:00:00+00:00  4.99  0.00277  0.000010   Buy
1         1       0 2022-01-29 02:00:00+00:00  4.99  0.00243  0.000009  Sell

>>> pf.plot().show()  

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/pf/from_orders_pf_plot.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/pf/from_orders_pf_plot.dark.svg#only-dark)

We can now change the `size`, `price`, and `fixed_fees` arrays to our liking and re-run the simulation to see how the performance of our trading strategy has been affected ![🧬](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f9ec.svg ":dna:")

## Summary[¶](https://vectorbt.pro/pvt_40509f46/documentation/portfolio/from-orders/#summary "Permanent link")

As we just learned, vectorbt deploys a range of preset simulators, each consisting of a Numba-compiled core, and a class method on top of [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) that wraps that core and supports it with diverse enhancements that make it easier and user-friendlier to operate. In particular, we looked at the most primitive simulator - "from orders", which takes a shape (timestamps x assets + parameter combinations), and at each single element of that shape, puts different information pieces like puzzles together to create an order instance. For visual thinkers: you can imagine it taking all arrays together, broadcasting them on the fly against a common shape, and overlaying them on top of each other to form a cube where each element viewed from top is a vector with order information from [Order](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.Order).

Because of flexible indexing, we don't have to actually broadcast and materialize all those arrays - vectorbt is smart enough to project (i.e., extrapolate) smaller arrays to bigger shapes, such that we can supply incomplete information per timestamp, per asset, or per the entire matrix, as if we supplied that information per each element. This way, there is almost no additional memory footprint, which allows us to conveniently work on big data and perform hyperparameter optimization without leaving Numba, as long as all input arrays fit into RAM, of course ![😉](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f609.svg ":wink:")

Finally, this documentation piece gave us a glimpse into how vectorbt gradually stacks various levels of abstraction to automate tasks. We started with just two commands - buy and sell, added tons of features on the way, and ended up with a Python method that makes it almost ridiculously easy to backtest things. And still, this method lies at the bottom of the food chain: it cannot backtest trading strategies where orders depend on the current simulation state, that is, we have to know all the order information prior to starting the simulation. But get ready, that's where signals and order functions come into play!

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/documentation/portfolio/from-orders.py.txt)