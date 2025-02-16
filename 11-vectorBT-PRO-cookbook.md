## Displaying[¶](https://vectorbt.pro/pvt_40509f46/cookbook/arrays/#displaying "Permanent link")

Any array, be it a NumPy array, Pandas object, or even a regular list, can be displayed as a table with [ptable](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.ptable), regardless of its size. When the function is called in a IPython environment such as Jupyter Lab, the table will become interactive.

Print out an array in various ways

```
vbt.ptable(df)  
vbt.ptable(df, ipython=False)  
vbt.ptable(df, ipython=False, tabulate=False)  

```

## Wrapper[¶](https://vectorbt.pro/pvt_40509f46/cookbook/arrays/#wrapper "Permanent link")

A wrapper can be extracted from any array-like object with [ArrayWrapper.from\_obj](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.from_obj).

Extract the wrapper from various objects

```
wrapper = data.symbol_wrapper  
wrapper = pf.wrapper  
wrapper = df.vbt.wrapper  

wrapper = vbt.ArrayWrapper.from_obj(sr)  

```

An empty Pandas array can be created with [ArrayWrapper.fill](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.fill).

Create an empty array with the same shape, index, and columns as in another array

```
new_float_df = wrapper.fill(np.nan)  
new_bool_df = wrapper.fill(False)  
new_int_df = wrapper.fill(-1)  

```

A NumPy array can be wrapped with a Pandas Series or DataFrame with [ArrayWrapper.wrap](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.wrap).

Convert NumPy array to Pandas

```
df = wrapper.wrap(arr)

```

## Product[¶](https://vectorbt.pro/pvt_40509f46/cookbook/arrays/#product "Permanent link")

Product of multiple DataFrames can be achieved with the accessor method [BaseAccessor.x](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.x). It can be called both as an instance and a class method.

Cross-join columns of multiple DataFrames

```
new_df1, new_df2 = df1.vbt.x(df2)  
new_df1, new_df2, new_df3 = df1.vbt.x(df2, df3)  
new_dfs = vbt.pd_acc.x(*dfs)  

```

To measure execution time of a code block by running it **only once**, use [Timer](https://vectorbt.pro/pvt_40509f46/api/utils/profiling/#vectorbtpro.utils.profiling.Timer).

Measure execution time by running once

```
with vbt.Timer() as timer:
    my_pipeline()

print(timer.elapsed())

```

Note

The code block may depend on Numba functions that need to be compiled first. To exclude any compilation time from the estimate (recommended since a compilation may take up to a minute while the code block may execute in milliseconds), dry-run the code block.

Another way is to repeatedly run a code block and assess some statistic, such as the shortest average execution time, which is easily doable with the help of the [timeit](https://docs.python.org/3/library/timeit.html) module and the corresponding vectorbtpro's function that returns the number in a human-readable format. The advantage of this approach is that any compilation overhead is effectively ignored.

Measure execution time by running multiple times

```
print(vbt.timeit(my_pipeline))

```

There's also a profiling tool for peak memory usage - [MemTracer](https://vectorbt.pro/pvt_40509f46/api/utils/profiling/#vectorbtpro.utils.profiling.MemTracer), which helps to determine an approximate size of all objects that are generated when running a code block.

Measure peak memory usage by running once

```
with vbt.MemTracer() as tracer:
    my_pipeline()

print(tracer.peak_usage())

```

Whenever some high-level task should be executed over and over again (for example, during a parameter optimization), it's recommended to occasionally clear the cache with [clear\_cache](https://vectorbt.pro/pvt_40509f46/api/registries/ca_registry/#vectorbtpro.registries.ca_registry.clear_cache) and collect the memory garbage to avoid growing RAM consumption through cached and dead objects.

Clear cache and collect garbage once every 1000 iterations

```
for i in range(1_000_000):
    ...  

    if i != 0 and i % 1000 == 0:
        vbt.flush()  

```

To clear the cache of some particular class, method, or instance, pass it directly to the function.

Clear the cache associated with various objects

```
vbt.clear_cache(vbt.PF)  
vbt.clear_cache(vbt.PF.total_return)  
vbt.clear_cache(pf)  

```

To print various statistics on the currently stored cache, use [print\_cache\_stats](https://vectorbt.pro/pvt_40509f46/api/registries/ca_registry/#vectorbtpro.registries.ca_registry.print_cache_stats).

Various way to print cache statistics

```
vbt.print_cache_stats()  
vbt.print_cache_stats(vbt.PF)  

```

To disable or enable caching globally, use [disable\_caching](https://vectorbt.pro/pvt_40509f46/api/registries/ca_registry/#vectorbtpro.registries.ca_registry.disable_caching) and [enable\_caching](https://vectorbt.pro/pvt_40509f46/api/registries/ca_registry/#vectorbtpro.registries.ca_registry.enable_caching) respectively.

Disable caching globally

```
vbt.disable_caching()

```

To disable or enable caching within a code block, use the context managers [CachingDisabled](https://vectorbt.pro/pvt_40509f46/api/registries/ca_registry/#vectorbtpro.registries.ca_registry.CachingDisabled) and [CachingEnabled](https://vectorbt.pro/pvt_40509f46/api/registries/ca_registry/#vectorbtpro.registries.ca_registry.CachingEnabled) respectively.

How to disable caching within a code block

```
with vbt.CachingDisabled():  
    ...  

...  

with vbt.CachingDisabled(vbt.PF):  
    ...

```

Numba can be disabled globally by setting an environment variable, or by changing the config (see [Environment variables](https://numba.readthedocs.io/en/stable/reference/envvars.html)).

Disable Numba via an environment variable

```
import os

os.environ["NUMBA_DISABLE_JIT"] = "1"

```

Disable Numba via the config

```
from numba import config

config.DISABLE_JIT = True

```

Same can be done by creating a [configuration](https://vectorbt.pro/pvt_40509f46/cookbook/configuration/#settings) file (such as `vbt.config`) with the following content:

Note

All the commands above have to be done before importing VBT.

To check whether Numba is enabled, use [is\_numba\_enabled](https://vectorbt.pro/pvt_40509f46/api/utils/checks/#vectorbtpro.utils.checks.is_numba_enabled).

Check whether Numba is enabled

```
print(vbt.is_numba_enabled())

```

## Objects[¶](https://vectorbt.pro/pvt_40509f46/cookbook/configuration/#objects "Permanent link")

Those VBT objects that subclass [Configured](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.Configured) (which make up the majority of the implemented classes) store the keyword arguments that were passed to their initializer, available under `config`. Copying an object simply means passing the same config to the class to create a new instance, which can be done automatically with the `copy()` method.

Copy a Portfolio instance

```
new_pf = pf.copy()
new_pf = vbt.PF(**pf.config)  

```

Since changing any information in-place is strongly discouraged due to caching reasons, replacing something means copying the config, changing it, and passing to the class, which can be done automatically with the `replace()` method.

Replace initial capital in a Portfolio instance

```
new_pf = pf.replace(init_cash=1_000_000)
new_pf = vbt.PF(**vbt.merge_dicts(pf.config, dict(init_cash=1_000_000))  

```

In many cases, one VBT object contains other VBT objects. To make changes to some deep vectorbtpro object, we can enable the `nested_` flag and pass the instruction as a nested dict.

Enable grouping in the wrapper of a Portfolio instance

```
new_pf = pf.replace(wrapper=dict(group_by=True), nested_=True)
new_pf = pf.replace(wrapper=pf.wrapper.replace(group_by=True))  

```

The same VBT objects can be saved as config files for effortless editing. Such a config file has a format that is very similar to the [INI format](https://en.wikipedia.org/wiki/INI_file) but enriched with various extensions such as code expressions and nested dictionaries, which allows representation of objects of any complexity.

Save a Portfolio instance to a config file and load it back

```
pf.save(file_format="config")



pf = vbt.PF.load()

```

## Settings[¶](https://vectorbt.pro/pvt_40509f46/cookbook/configuration/#settings "Permanent link")

Settings that control the default behavior of most functionalities across VBT are located under [settings](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings). Each functionality has its own config; for example, [settings.portfolio](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.portfolio) defines the defaults around the [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) class. All configs are then consolidated into a single config that can be accessed via `vbt.settings`.

Set the default initial cash

```
vbt.settings.portfolio.init_cash = 1_000_000

```

The initial state of any config can be accessed via `options_["reset_dct"]`.

Get the default initial cash before any changes

```
print(vbt.settings.portfolio.options_["reset_dct"]["init_cash"])  

```

Any config can be reset to its initial state by using the `reset()` method.

Reset the Portfolio config

```
vbt.settings.portfolio.reset()

```

For more convenience, settings can be defined in a text file that will be loaded automatically the next time VBT is imported. The file should be placed in the directory of the script that is importing the package, and named `vbt.ini` or `vbt.config`. Or, the path to the settings file can be also provided by setting the environment variable `VBT_SETTINGS_PATH`. It must have the [INI format](https://en.wikipedia.org/wiki/INI_file#Format) that has been extended by vectorbtpro, see [Pickleable.decode\_config](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.Pickleable.decode_config) for examples.

Configuration file that defines the default initial cash

```

[portfolio]
init_cash = 1_000_000

```

This is especially useful for changing the settings that take into effect only once on import, such as various Numba-related settings and caching and chunking machineries.

Configuration file that disables Numba

```

[numba]
disable = True

```

To save all settings or some specific config to a text file, modify it, and let VBT load it on import (or do it manually), use the `save()` method with `file_format="config"`.

Save Portfolio config and import it automatically

```
vbt.settings.portfolio.save("vbt.config", top_name="portfolio")

```

Save Portfolio config and import it manually

```
vbt.settings.portfolio.save("portfolio.config")



vbt.settings.portfolio.load_update("portfolio.config")

```

If readability of the file is not of relevance, settings can be modified in place and then saved to a Pickle file in one Python session to be automatically imported in the next session.

Disable Numba in the next Python session

```
vbt.settings.numba.disable = True
vbt.settings.save("vbt")

```

Warning

This approach is discouraged if you plan to upgrade VBT frequently, as each new release may introduce changes to the settings.


## Splitting[¶](https://vectorbt.pro/pvt_40509f46/cookbook/cross-validation/#splitting "Permanent link")

To pick a fixed number of windows and optimize the window length such that they collectively cover the maximum amount of the index while keeping the train or test set non-overlapping, use [Splitter.from\_n\_rolling](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/base/#vectorbtpro.generic.splitting.base.Splitter.from_n_rolling) with `length="optimize"`. Under the hood, it minimizes any empty space using SciPy.

Pick longest 20 windows for WFA such that test ranges don't overlap

```
splitter = vbt.Splitter.from_n_rolling(
    data.index,
    n=20,
    length="optimize",
    split=0.7,  
    optimize_anchor_set=1,  
    set_labels=["train", "test"]
)

```

When using [Splitter.from\_rolling](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/base/#vectorbtpro.generic.splitting.base.Splitter.from_rolling) and the last window doesn't fit, it will be removed, leaving a gap on the right-hand side. To remove the oldest window instead, use `backwards="sorted"`.

Roll a window that fills more recent data and with no gaps between test sets

```
length = 1000
ratio = 0.95
train_length = round(length * ratio)
test_length = length - train_length

splitter = vbt.Splitter.from_rolling(
    data.index,
    length=length,
    split=train_length,
    offset_anchor_set=None,
    offset=-test_length,
    backwards="sorted"
)

```

To create a gap between the train set and the test set, use [RelRange](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/base/#vectorbtpro.generic.splitting.base.RelRange) with `is_gap=True`.

Roll an expanding window with a variable train set, a gap of 10 rows, and a test set of 20 rows

```
splitter = vbt.Splitter.from_expanding(
    data.index,
    min_length=130,
    offset=10,  
    split=(1.0, vbt.RelRange(length=10, is_gap=True), 20),
    split_range_kwargs=dict(backwards=True)  
)

```

To roll a time-periodic window, use [Splitter.from\_ranges](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/base/#vectorbtpro.generic.splitting.base.Splitter.from_ranges) with `every` and `lookback_period` arguments as date offsets.

Reserve 3 years for training and 1 year for testing

```
splitter = vbt.Splitter.from_ranges(
    data.index,
    every="Y",
    lookback_period="4Y",
    split=(
        vbt.RepEval("index.year != index.year[-1]"),  
        vbt.RepEval("index.year == index.year[-1]")  
    )
)

```

### Taking[¶](https://vectorbt.pro/pvt_40509f46/cookbook/cross-validation/#taking "Permanent link")

To split an object along the index (time) axis, we need to create a [Splitter](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/base/#vectorbtpro.generic.splitting.base.Splitter) instance and then "take" chunks from that object.

How to split an object in two lines

```
splitter = vbt.Splitter.from_n_rolling(data.index, n=10)
data_chunks = splitter.take(data)  

# ______________________________________________________________

splitter = vbt.Splitter.from_ranges(df.index, every="W")
new_df = splitter.take(df, into="reset_stacked")  

```

Also, most VBT objects have a `split` method that can combine these both operations into one. The method will determine the correct splitting operation automatically based on the supplied arguments.

How to split an object in one line

```
data_chunks = data.split(n=10)  

# ______________________________________________________________

new_df = df.vbt.split(every="W")  

```

## Testing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/cross-validation/#testing "Permanent link")

To cross-validate a function that takes only one parameter combination at a time on a grid of parameter combinations, use [`@vbt.cv_split`](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/decorators/#vectorbtpro.generic.splitting.decorators.cv_split). It's a combination of [`@vbt.parameterized`](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.parameterized) (which takes a grid of parameter combinations and runs a function on each combination while merging the results) and [`@vbt.split`](https://vectorbt.pro/pvt_40509f46/api/generic/splitting/decorators/#vectorbtpro.generic.splitting.decorators.split) (which runs a function on each split and set combination).

Cross-validate a function to maximize the Sharpe ratio

```
def selection(grid_results):  
    return vbt.LabelSel([grid_results.idxmax()])  

@vbt.cv_split(
    splitter="from_n_rolling",  
    splitter_kwargs=dict(n=10, split=0.5, set_labels=["train", "test"]),  
    takeable_args=["data"],  
    execute_kwargs=dict(),  
    parameterized_kwargs=dict(merge_func="concat"),  
    merge_func="concat",  
    selection=vbt.RepFunc(selection),  
    return_grid=False  
)
def my_pipeline(data, param1_value, param2_value):  
    ...
    return pf.sharpe_ratio

cv_sharpe_ratios = my_pipeline(  
    data,
    vbt.Param(param1_values),
    vbt.Param(param2_values)
)

# ______________________________________________________________

@vbt.cv_split(..., takeable_args=None)  
def my_pipeline(range_, data, param1_value, param2_value):
    data_range = data.iloc[range_]
    ...
    return pf.sharpe_ratio

cv_sharpe_ratios = my_pipeline(
    vbt.Rep("range_"),
    data,
    vbt.Param([1, 2, 3]),
    vbt.Param([1, 2, 3]),
    _index=data.index  
)

```

To skip a parameter combination, return [NoResult](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.NoResult). This may be helpful to exclude a parameter combination that raises an error. `NoResult` can be also returned by the selection function to skip the entire split and set combination. Once excluded, the combination won't be visible in the final index.

Skip split and set combinations where there are no satisfactory parameters

```


def selection(grid_results):
    sharpe_ratio = grid_results.xs("Sharpe Ratio", level=-1).astype(float)
    return vbt.LabelSel([sharpe_ratio.idxmax()])

@vbt.cv_split(...)
def my_pipeline(...):
    ...
    stats_sr = pf.stats(agg_func=None)
    if stats_sr["Min Value"] > 0 and stats_sr["Total Trades"] >= 20:  
        return stats_sr
    return vbt.NoResult

# ______________________________________________________________



def selection(grid_results):
    sharpe_ratio = grid_results.xs("Sharpe Ratio", level=-1).astype(float)
    min_value = grid_results.xs("Min Value", level=-1).astype(float)
    total_trades = grid_results.xs("Total Trades", level=-1).astype(int)
    sharpe_ratio = sharpe_ratio[(min_value > 0) & (total_trades >= 20)]
    if len(sharpe_ratio) == 0:
        return vbt.NoResult
    return vbt.LabelSel([sharpe_ratio.idxmax()])

@vbt.cv_split(...)
def my_pipeline(...):
    ...
    return pf.stats(agg_func=None)

```

To warm up one or more indicators, instruct VBT to pass a date range instead of selecting it from data, and prepend a buffer to this date range. Then, manually select this extended date range from the data and run your indicators on the selected date range. Finally, remove the buffer from the indicator(s).

Warm up a SMA crossover

```
@vbt.cv_split(..., index_from="data")
def buffered_sma_pipeline(data, range_, fast_period, slow_period, ...):
    buffer_len = max(fast_period, slow_period)  
    buffered_range = slice(range_.start - buffer_len, range_.stop)  
    data_buffered = data.iloc[buffered_range]  

    fast_sma_buffered = data_buffered.run("sma", fast_period, hide_params=True)
    slow_sma_buffered = data_buffered.run("sma", slow_period, hide_params=True)
    entries_buffered = fast_sma_buffered.real_crossed_above(slow_sma_buffered)
    exits_buffered = fast_sma_buffered.real_crossed_below(slow_sma_buffered)

    data = data_buffered.iloc[buffer_len:]  
    entries = entries_buffered.iloc[buffer_len:]
    exits = exits_buffered.iloc[buffer_len:]
    ...

buffered_sma_pipeline(
    data,  
    vbt.Rep("range_"),  
    vbt.Param(fast_periods, condition="x < slow_period"),
    vbt.Param(slow_periods),
    ...
)

```

There are plenty of supported data sources for OHLC and indicator data. For the full list, see the [custom](https://vectorbt.pro/pvt_40509f46/api/data/custom/) module.

## Listing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/data/#listing "Permanent link")

Many classes have a class method to list all symbols that can be fetched. Usually, such as method starts with `list_`, for example, [TVData.list\_symbols](https://vectorbt.pro/pvt_40509f46/api/data/custom/tv/#vectorbtpro.data.custom.tv.TVData.list_symbols), [SQLData.list\_tables](https://vectorbt.pro/pvt_40509f46/api/data/custom/sql/#vectorbtpro.data.custom.sql.SQLData.list_tables), or [CSVData.list\_paths](https://vectorbt.pro/pvt_40509f46/api/data/custom/csv/#vectorbtpro.data.custom.csv.CSVData.list_paths). In addition, most methods allow client-side filtering of symbols by a glob-style or regex-style pattern.

How to list symbols

```
all_symbols = vbt.BinanceData.list_symbols()  
usdt_symbols = vbt.BinanceData.list_symbols("*USDT")  
usdt_symbols = vbt.BinanceData.list_symbols(r"^.+USDT$", use_regex=True)

all_symbols = vbt.TVData.list_symbols()  
nasdaq_symbols = vbt.TVData.list_symbols(exchange_pattern="NASDAQ")  
btc_symbols = vbt.TVData.list_symbols(symbol_pattern="BTC*")  
pl_symbols = vbt.TVData.list_symbols(market="poland")  
usdt_symbols = vbt.TVData.list_symbols(fields=["currency"], filter_by=["USDT"])  

def filter_by(market_cap_basic):
    if market_cap_basic is None:
        return False
    return market_cap_basic >= 1_000_000_000_000

trillion_symbols = vbt.TVData.list_symbols(  
    fields=["market_cap_basic"], 
    filter_by=vbt.RepFunc(filter_by)
)

all_paths = vbt.FileData.list_paths()  
csv_paths = vbt.CSVData.list_paths()  
all_csv_paths = vbt.CSVData.list_paths("**/*.csv")  
all_data_paths = vbt.HDFData.list_paths("data.h5")  
all_paths = vbt.HDFData.list_paths()  

all_schemas = vbt.SQLData.list_schemas(engine=engine)  
all_tables = vbt.SQLData.list_tables(engine=engine)  

```

## Pulling[¶](https://vectorbt.pro/pvt_40509f46/cookbook/data/#pulling "Permanent link")

Each class has the method `fetch_symbol()` for fetching a single symbol and returning raw data, usually in a form of a DataFrame. To return a data instance, the method `pull()` should be used, which takes one or multiple symbols, calls `fetch_symbol()` on each one, and aligns all DataFrames. For testing, use [YFData](https://vectorbt.pro/pvt_40509f46/api/data/custom/yf/#vectorbtpro.data.custom.yf.YFData), which is easy to use but poor in terms of quality. For production, use more reliable data sources, such as [CCXTData](https://vectorbt.pro/pvt_40509f46/api/data/custom/ccxt/#vectorbtpro.data.custom.ccxt.CCXTData) for crypto and [AlpacaData](https://vectorbt.pro/pvt_40509f46/api/data/custom/alpaca/#vectorbtpro.data.custom.alpaca.AlpacaData) for stocks. For technical analysis based on the most recent data, use [TVData](https://vectorbt.pro/pvt_40509f46/api/data/custom/tv/#vectorbtpro.data.custom.tv.TVData) (TradingView).

How to fetch data

```
data = vbt.YFData.pull("AAPL")  
data = vbt.YFData.pull(["AAPL", "MSFT"])  
data = vbt.YFData.pull("AAPL", start="2020")  
data = vbt.YFData.pull("AAPL", start="2020", end="2021")  
data = vbt.YFData.pull("AAPL", start="1 month ago")  
data = vbt.YFData.pull("AAPL", start="1 month ago", timeframe="hourly")  
data = vbt.YFData.pull("AAPL", tz="UTC")  
data = vbt.YFData.pull(symbols, execute_kwargs=dict(engine="threadpool"))  

data = vbt.BinanceData.pull("BTCUSDT", klines_type="futures")  
data = vbt.CCXTData.pull("BTCUSDT", exchange="binanceusdm")  
data = vbt.BinanceData.pull("BTCUSDT", tld="us")  
data = vbt.TVData.pull("CRYPTOCAP:TOTAL")  

```

To provide different keyword arguments for different symbols, either pass an argument as [symbol\_dict](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.symbol_dict) or pass a dictionary with keyword arguments keyed by symbol as the first argument.

How to provide keyword arguments by symbol

```
data = vbt.TVData.pull(
    ["SPX", "NDX", "VIX"],
    exchange=vbt.symbol_dict({"SPX": "SP", "NDX": "NASDAQ", "VIX": "CBOE"})
)
data = vbt.TVData.pull({  
    "SPX": dict(exchange="SP"),
    "NDX": dict(exchange="NASDAQ"),
    "VIX": dict(exchange="CBOE")
})
data = vbt.TVData.pull(["SP:SPX", "NASDAQ:NDX", "CBOE:VIX"])  

```

If your data provider of choice takes credentials and you want to fetch multiple symbols, the client will be created for each symbol leading to multiple authentications and a slower execution. To avoid that, create the client in advance and then pass to the `fetch()` method.

Create a Data client in advance

```
client = vbt.TVData.resolve_client(username="YOUR_USERNAME", password="YOUR_PASSWORD")

```

Use the Data client

```
data = vbt.TVData.pull(["NASDAQ:AAPL", "NASDAQ:MSFT"], client=client)

# ______________________________________________________________

vbt.TVData.set_custom_settings(client=client)
data = vbt.TVData.pull(["NASDAQ:AAPL", "NASDAQ:MSFT"])

```

## Persisting[¶](https://vectorbt.pro/pvt_40509f46/cookbook/data/#persisting "Permanent link")

Once fetched, the data can be saved in a variety of ways. The most common and recommended way is by pickling the data, which will save the entire object including the arguments used during fetching. Another ways include CSV files ([Data.to\_csv](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.to_csv)), HDF files ([Data.to\_hdf](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.to_hdf)) and more, which will save only the data but not the accompanied metadata such as the timeframe.

How to save data

```
data.save()  
data.save(compression="blosc")  

data.to_csv("data", mkdir_kwargs=dict(mkdir=True))  
data.to_csv("AAPL.csv")  
data.to_csv("AAPL.tsv", sep="\t")  
data.to_csv(vbt.symbol_dict(AAPL="AAPL.csv", MSFT="MSFT.csv"))  
data.to_csv(vbt.RepEval("symbol + '.csv'"))  

data.to_hdf("data")  
data.to_hdf("data.h5")  
data.to_hdf("data.h5", key=vbt.RepFunc(lambda symbol: symbol.replace(" ", "_")))  
data.to_hdf("data.h5", key=vbt.RepFunc(lambda symbol: "stocks/" + symbol))  
data.to_hdf(vbt.RepEval("symbol + '.h5'"), key="df")  

data.to_parquet("data")  
data.to_parquet(vbt.symbol_dict(
    AAPL="data/AAPL.parquet", 
    MSFT="data/MSFT.parquet"
))  
data.to_parquet("data", partition_by="Y")  
data.to_parquet(vbt.symbol_dict(
    AAPL="data/AAPL", 
    MSFT="data/MSFT"
), partition_by="Y")  

data.to_sql(engine="sqlite:///data.db")  
data.to_sql(engine="postgresql+psycopg2://postgres:admin@localhost:5432/data")  
data.to_sql(engine=engine, schema="yahoo")  
data.to_sql(engine=engine, table=vbt.symbol_dict(AAPL="AAPL", MSFT="MSFT"))  
data.to_sql(engine=engine, if_exists="replace")  
data.to_sql(engine=engine, attach_row_number=True)  
data.to_sql(
    engine=engine, 
    attach_row_number=True, 
    row_number_column="RN",
    from_row_number=vbt.symbol_dict(AAPL=100, MSFT=200), 
    if_exists="append"
)  

```

Once saved, the data can be loaded with the corresponding class method.

How to load data

```
data = vbt.YFData.load()  

data = vbt.Data.from_csv("data")  
data = vbt.Data.from_csv("data/*.csv")  
data = vbt.Data.from_csv("data/*/**.csv")  
data = vbt.Data.from_csv(symbols=["BTC-USD.csv", "ETH-USD.csv"])  
data = vbt.Data.from_csv(features=["High.csv", "Low.csv"])  
data = vbt.Data.from_csv("BTC-USD", paths="polygon_btc_1hour.csv")  
data = vbt.Data.from_csv("AAPL.tsv", sep="\t")  
data = vbt.Data.from_csv(["MSFT.csv", "AAPL.tsv"], sep=vbt.symbol_dict(MSFT=",", AAPL="\t"))  
data = vbt.Data.from_csv("https://datahub.io/core/s-and-p-500/r/data.csv", match_paths=False)  

data = vbt.Data.from_hdf("data")  
data = vbt.Data.from_hdf("data.h5")  
data = vbt.Data.from_hdf("data.h5/AAPL")  
data = vbt.Data.from_hdf(["data.h5/AAPL", "data.h5/MSFT"])  
data = vbt.Data.from_hdf(["AAPL", "MSFT"], paths="data.h5", match_paths=False)
data = vbt.Data.from_hdf("data.h5/stocks/*")  

data = vbt.Data.from_parquet("data")  
data = vbt.Data.from_parquet("AAPL.parquet")  
data = vbt.Data.from_parquet("AAPL")  

data = vbt.Data.from_sql(engine="sqlite:///data.db")  
data = vbt.Data.from_sql("AAPL", engine=engine)  
data = vbt.Data.from_sql("yahoo:AAPL", engine=engine)  
data = vbt.Data.from_sql("AAPL", schema="yahoo", engine=engine)  
data = vbt.Data.from_sql("AAPL", query="SELECT * FROM AAPL", engine=engine)  

data = vbt.BinanceData.from_csv("BTCUSDT.csv", fetch_kwargs=dict(timeframe="hourly"))  

```

## Updating[¶](https://vectorbt.pro/pvt_40509f46/cookbook/data/#updating "Permanent link")

Some data classes support fetching and appending new data to previously saved data by overriding the method [Data.update\_symbol](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.update_symbol), which scans the data for the latest timestamp and uses it as the start timestamp for fetching new data with [Data.fetch\_symbol](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.fetch_symbol). The method [Data.update](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.update) then does it for each symbol in the data instance. There's no need to provide the client, timeframe, or other arguments since they were captured during fetching and are reused automatically (unless they were lost by converting the data instance to Pandas, CSV, or HDF!).

Download 1-minute data and update it later

```
data = vbt.YFData.pull("AAPL", timeframe="1 minute")



data = data.update()  

```

Download one year of data at a time

```
start = 2010
end = 2020
data = None
while start < end:
    if data is None:
        data = vbt.YFData.pull("AAPL", start=str(start), end=str(start + 1))
    else:
        data = data.update(end=str(start + 1))
    start += 1

```

## Wrapping[¶](https://vectorbt.pro/pvt_40509f46/cookbook/data/#wrapping "Permanent link")

Custom DataFrame can be wrapped into a data instance by using [Data.from\_data](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.from_data), which takes either a single DataFrame for one symbol, or a dict with more DataFrames keyed by their symbols.

Create a new Data instance

```
data = ohlc_df.vbt.ohlcv.to_data()  
data = vbt.Data.from_data(ohlc_df)

data = close_df.vbt.to_data()  
data = vbt.Data.from_data(close_df, columns_are_symbols=True)

data = close_df.vbt.to_data(invert=True)  
data = vbt.Data.from_data(close_df, columns_are_symbols=True, invert=True)

data = vbt.Data.from_data(vbt.symbol_dict({"AAPL": aapl_ohlc_df, "MSFT": msft_ohlc_df}))  
data = vbt.Data.from_data(vbt.feature_dict({"High": high_df, "Low": low_df}))  

```

Tip

You aren't required to use data instances, you can proceed with Pandas and even NumPy arrays as well since VBT converts every array-like object to a NumPy array anyway. But beware that the Pandas format is more suitable than the NumPy format because the former also contains datetime index and backtest configuration metadata such as symbols and parameter combinations in form of columns. Where data instances are essential are symbol alignment, stacking, resampling, and updating.

Depending on the use case, there are multiple ways to extract the actual Pandas Series/DataFrame from an instance. To retrieve the original data with one DataFrame per symbol, query the `data` attribute. Such data contains OHLC and other features (of various data types too) concatenated together, which may be helpful in plotting. But note that VBT doesn't support this format: instead, you're encouraged to represent each feature as a separate DataFrame where columns are symbols. Such a feature can be queried as an attribute (`data.close` for close price, for example), or by using [Data.get](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.get).

How to get symbol-oriented data

```
data_per_symbol = data.data  
aapl_data = data_per_symbol["AAPL"]  

sr_or_df = data.get("Close")  
sr_or_df = data["Close"].get()
sr_or_df = data.close

sr_or_df = data.get(["Close"])  
sr_or_df = data[["Close"]].get()

sr = data.get("Close", "AAPL")  
sr = data["Close"].get(symbols="AAPL")
sr = data.select("AAPL").close

df = data.get("Close", ["AAPL"])  
df = data["Close"].get(symbols=["AAPL"])
df = data.select(["AAPL"]).close

aapl_df = data.get(["Open", "Close"], "AAPL")  
close_df = data.get("Close", ["AAPL", "MSFT"])  
open_df, close_df = data.get(["Open", "Close"], ["AAPL", "MSFT"])  

```

If a data instance is feature-oriented, the behavior of features and symbols is reversed.

How to get feature-oriented data

```
data_per_feature = feat_data.data  
close_data = data_per_feature["Close"]

sr_or_df = data.get("Close") 
sr_or_df = data.select("Close").get()
sr_or_df = data.close

sr = feat_data.get("Close", "AAPL")
sr = feat_data["AAPL"].get(features="Close")  
sr = feat_data.select("Close").get(symbols="AAPL")  

aapl_df = data.get(["Open", "Close"], "AAPL")
close_df = data.get("Close", ["AAPL", "MSFT"])
aapl_df, msft_df = data.get(["Open", "Close"], ["AAPL", "MSFT"])  

```

Tip

To get the same behavior between symbol-oriented and feature-oriented instances, always use [Data.get](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.get) to extract the data.

## Changing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/data/#changing "Permanent link")

There are four main operations to change features and symbols: adding, selecting, renaming, and removing. The first operation can be done on one feature or symbol at a time, while other operations can be done on a multiple of such. Usually, you won't need to specify whether you want to perform the operation on symbols or features as this will be determined automatically. Features and symbols are also case-insensitive. Also note that each operation doesn't change the original data instance but returns a new one.

How to add features and symbols

```
new_data = data.add_symbol("BTC-USD")  
new_data = data.add_symbol("BTC-USD", fetch_kwargs=dict(start="2020"))  
btc_df = vbt.YFData.pull("ETH-USD", start="2020").get()
new_data = data.add_symbol("BTC-USD", btc_df)  

new_data = data.add_feature("SMA")  
new_data = data.add_feature("SMA", run_kwargs=dict(timeperiod=20, hide_params=True))  
sma_df = data.run("SMA", timeperiod=20, hide_params=True, unpack=True)
new_data = data.add_feature("SMA", sma_df)  

new_data = data.add("BTC-USD", btc_df)  
new_data = data.add("SMA", sma_df)  

```

Note

Only one feature or symbol can be added at a time. To add another data instance, use `merge` instead.

How to select features and symbols

```
new_data = data.select_symbols("BTC-USD")  
new_data = data.select_symbols(["BTC-USD", "ETH-USD"])  

new_data = data.select_features("SMA")  
new_data = data.select_features(["SMA", "EMA"])  

new_data = data.select("BTC-USD")  
new_data = data.select("SMA")  
new_data = data.select("sma")  

```

How to rename features and symbols

```
new_data = data.rename_symbols("BTC-USD", "BTCUSDT")  
new_data = data.rename_symbols(["BTC-USD", "ETH-USD"], ["BTCUSDT", "ETHUSDT"])  
new_data = data.rename_symbols({"BTC-USD": "BTCUSDT", "ETH-USD": "ETHUSDT"})

new_data = data.rename_features("Price", "Close")  
new_data = data.rename_features(["Price", "MovAvg"], ["Close", "SMA"])  
new_data = data.rename_features({"Price": "Close", "MovAvg": "SMA"})

new_data = data.rename("BTC-USD", "BTCUSDT")  
new_data = data.rename("Price", "Close")  
new_data = data.rename("price", "Close")  

```

How to remove features and symbols

```
new_data = data.remove_symbols("BTC-USD")  
new_data = data.remove_symbols(["BTC-USD", "ETH-USD"])  

new_data = data.remove_features("SMA")  
new_data = data.remove_features(["SMA", "EMA"])  

new_data = data.remove("BTC-USD")  
new_data = data.remove("SMA")  
new_data = data.remove("sma")  

```

Instances can be merged together along symbols, rows, and columns by using [Data.merge](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.merge).

Merge multiple different Data instances

```
data1 = vbt.YFData.pull("BTC-USD")
data2 = vbt.BinanceData.pull("BTCUSDT")
data3 = vbt.CCXTData.pull("BTC-USDT", exchange="kucoin")
data = vbt.Data.merge(data1, data2, data3, missing_columns="drop")

```

To apply a function to each DataFrame and return a new instance, the method [Data.transform](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.transform) can be used. By default, it passes one single DataFrame where all individual DataFrames are concatenated along columns. This is useful for dropping missing values across all symbols. To transform the DataFrames individually, use `per_symbol=True` and/or `per_feature=True`. The only requirement is that the returned column names are identical across all features and symbols.

Drop rows with missing values

```
new_data = data.transform(lambda df: df.dropna(how="any"))  
new_data = data.dropna()  
new_data = data.dropna(how="all")  

new_data = data.transform(your_func, per_feature=True)
new_data = data.transform(your_func, per_symbol=True)
new_data = data.transform(your_func, per_feature=True, per_symbol=True)  
new_data = data.transform(your_func, per_feature=True, per_symbol=True, pass_frame=True)  

```

If symbols have different timezones, the final timezone will become "UTC". This will make some symbols shifted in time; for example, one symbol with UTC+0200 and another with UTC+0400 will effectively double the common index and produce missing values half of the time. To align their indexes into a single one, use [Data.realign](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.realign), which is a special form of resampling that produces a single index where data is correctly ordered by time.

Realign multiple timezones

```
new_data = data.realign()  

```

Operations that return a new data instance can be easily chained using the dot notation or the method `pipe`.

Chain multiple operations

```
data = (
    vbt.YFData.pull("BTC-USD")
    .add_symbol("ETH-USD")
    .rename({"btc-usd": "BTCUSDT", "eth-usd": "ETHUSDT"})
    .remove(["dividends", "stock splits"])
    .add_feature("SMA")
    .add_feature("EMA")
)

# ______________________________________________________________

data = (
    vbt.YFData
    .pipe("pull", "BTC-USD")  
    .pipe("add_symbol", "ETH-USD")
    .pipe("rename", {"btc-usd": "BTCUSDT", "eth-usd": "ETHUSDT"})
    .pipe("remove", ["dividends", "stock splits"])
    .pipe("add_feature", "SMA")
    .pipe("add_feature", "EMA")
)

```

VBT loves flexibility, and so it allows us to construct various datetime-related objects from human-readable strings.

## Timestamps[¶](https://vectorbt.pro/pvt_40509f46/cookbook/datetime/#timestamps "Permanent link")

Timestamps represent a single point in time, similar to a datetime object in Python's `datetime` module, but with enhanced functionality for data analysis and manipulation.

How to construct a timestamp

```
vbt.timestamp()  
vbt.utc_timestamp()  
vbt.local_timestamp()  
vbt.timestamp(tz="America/New_York")  
vbt.timestamp("1 Jul 2020")  
vbt.timestamp("7 days ago")  

```

## Timezones[¶](https://vectorbt.pro/pvt_40509f46/cookbook/datetime/#timezones "Permanent link")

Timezones can be used in timestamps, making it a powerful tool for global time-based data analysis.

How to construct a timezone

```
vbt.timezone()  
vbt.timezone("utc")  
vbt.timezone("America/New_York")  
vbt.timezone("+0500")  

```

## Timedeltas[¶](https://vectorbt.pro/pvt_40509f46/cookbook/datetime/#timedeltas "Permanent link")

Timedeltas deal with continuous time spans and precise time differences. They are commonly used for adding or subtracting durations from timestamps, or for measuring the difference between two timestamps.

How to construct a timedelta

```
vbt.timedelta()  
vbt.timedelta("7 days")  
vbt.timedelta("weekly")
vbt.timedelta("Y", approximate=True)  

```

## Date offsets[¶](https://vectorbt.pro/pvt_40509f46/cookbook/datetime/#date-offsets "Permanent link")

Date offsets handle calendar-specific offsets (e.g., adding a month, skipping weekends with business days). They are commonly used for calendar-aware adjustments and recurring periods.

How to construct a date offset

```
vbt.offset("Y")  
vbt.offset("YE")  
vbt.offset("weekstart")  
vbt.offset("monday")
vbt.offset("july")  

```

The arguments and optionally the description of any Python function or class can be displayed with [phelp](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.phelp). For example, we can quickly determine which inputs, outputs, and parameters does the indicator's `run()` function accept.

Print the specification of the TA-Lib's ATR

```
vbt.phelp(vbt.talib("atr").run)

```

Note

This is not the same as calling the Python's `help` command - it only works on functions.

The attributes of any Python object can be listed with [pdir](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.pdir). This can become handy when trying to determine whether an object contains a specific attribute without having to search the API documentation.

Print the properties and methods of the Portfolio class

```
vbt.pdir(vbt.PF)

```

Tip

We can even apply it on third-party objects such as packages!

Most VBT objects can be expanded and pretty-formatted to quickly unveil their contents with [pprint](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.pprint). For example, it's a simple way to visually confirm whether the object has a correct shape and grouping.

Print the configuration of a Data instance

```
vbt.pprint(data)

```

Most VBT objects can be connected to the API reference on the website and the source code on GitHub with [open\_api\_ref](https://vectorbt.pro/pvt_40509f46/api/utils/module_/#vectorbtpro.utils.module.open_api_ref). The function takes an actual VBT object, its name, or its absolute path inside the package. It can also take third-party objects; in this case, it will search for them with [DuckDuckGo](https://duckduckgo.com/) and open the first link.

How to open the online API reference

```
vbt.open_api_ref(vbt.nb)  
vbt.open_api_ref(vbt.nb.rolling_mean_nb)  
vbt.open_api_ref(vbt.PF)  
vbt.open_api_ref(vbt.Data.run)  
vbt.open_api_ref(vbt.Data.features)  
vbt.open_api_ref(vbt.ADX.adx_crossed_above)  
vbt.open_api_ref(vbt.settings)  
vbt.open_api_ref(pf.get_sharpe_ratio)  
vbt.open_api_ref((pf, "sharpe_ratio"))  
vbt.open_api_ref(pd.DataFrame)  
vbt.open_api_ref("vbt.PF")  
vbt.open_api_ref("SizeType")  
vbt.open_api_ref("DataFrame", module="pandas")  
vbt.open_api_ref("numpy.char.find", resolve=False)  

```

Tip

To get the link without opening it, use [get\_api\_ref](https://vectorbt.pro/pvt_40509f46/api/utils/module_/#vectorbtpro.utils.module.get_api_ref), which takes the same arguments.

To open the first result to an arbitrary search query, use [imlucky](https://vectorbt.pro/pvt_40509f46/api/utils/module_/#vectorbtpro.utils.module.imlucky).

Ask a question if you feel lucky

```
vbt.imlucky("How to create a structured NumPy array?")  

```

Most VBT objects, such as data instances and portfolios, can be indexed like regular Pandas objects using the `[]`, `iloc`, `loc`, and `xs` selectors. The operation is passed down to all arrays inside the instance, and a new instance with the new arrays is created.

Select a date range of a Data instance

```
new_data = data.loc["2020-01-01":"2020-12-31"]

```

In addition, there's a special selector `xloc` that accepts a smart indexing instruction. Such an instruction can contain one or more positions, labels, dates, times, ranges, frequencies, or even date offsets. It's parsed automatically and translated into an array with integer positions that are internally passed to the `iloc` selector.

Various smart row indexing operations on a Data instance

```
new_data = data.xloc[::2]  
new_data = data.xloc[np.array([10, 20, 30])]  
new_data = data.xloc["2020-01-01 17:30"]  
new_data = data.xloc["2020-01-01"]  
new_data = data.xloc["2020-01"]  
new_data = data.xloc["2020"]  
new_data = data.xloc["2020-01-01":"2021-01-01"]  
new_data = data.xloc["january":"april"]  
new_data = data.xloc["monday":"saturday"]  
new_data = data.xloc["09:00":"16:00"]  
new_data = data.xloc["16:00":"09:00"]  
new_data = data.xloc["monday 09:00":"friday 16:00"]  
new_data = data.xloc[
    vbt.autoidx(slice("monday", "friday"), closed_end=True) &  
    vbt.autoidx(slice("09:00", "16:00"), closed_end=False)
]
new_data = data.xloc["Y"]  
new_data = data.xloc[pd.Timedelta(days=7)]  
new_data = data.xloc[df.index.weekday == 0]  
new_data = data.xloc[pd.tseries.offsets.BDay()]  

```

Not only rows can be selected but also columns by combining [rowidx](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.RowIdxr) and [colidx](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.ColIdxr) instructions.

Various smart row and/or column indexing operations on a DataFrame accessor

```
new_df = df.vbt.xloc[vbt.colidx(0)].get()  
new_df = df.vbt.xloc[vbt.colidx("BTC-USD")].get()  
new_df = df.vbt.xloc[vbt.colidx((10, "simple", "BTC-USD"))].get()  
new_df = df.vbt.xloc[vbt.colidx("BTC-USD", level="symbol")].get()  
new_df = df.vbt.xloc["2020", "BTC-USD"].get()  

```

Info

Without the `get()` call the accessor will be returned. There's **no need** for this call when indexing other VBT objects, such as portfolios.

Pandas accessors can also be used to modify the values under some rows and columns. This isn't possible for more complex VBT objects.

Enter at the beginning of the business day, exit at the end

```
entries.vbt.xloc[vbt.autoidx(slice("mon", "sat")) & vbt.autoidx("09:00")] = True  
exits.vbt.xloc[vbt.autoidx(slice("mon", "sat")) & (vbt.autoidx("16:00") << 1)] = True  

entries.vbt.xloc[vbt.pointidx(every="B", at_time="09:00")] = True  
exits.vbt.xloc[vbt.pointidx(every="B", at_time="16:00", indexer_method="before")] = True

```

## Listing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/indicators/#listing "Permanent link")

To list the currently supported indicators, use [IndicatorFactory.list\_indicators](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.list_indicators). The returned indicator names can be filtered by location, which can be listed with [IndicatorFactory.list\_locations](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.list_locations), or by evaluating a glob or regex pattern.

List supported indicators and locations

```
indicator_names = vbt.IF.list_indicators()  
indicator_names = vbt.IF.list_indicators("vbt")  
indicator_names = vbt.IF.list_indicators("talib")  
indicator_names = vbt.IF.list_indicators("RSI*")  
indicator_names = vbt.IF.list_indicators("*ma")  
indicator_names = vbt.IF.list_indicators("[a-z]+ma$", use_regex=True)  
indicator_names = vbt.IF.list_indicators("*ma", location="pandas_ta")  

location_names = vbt.IF.list_locations()  

```

Note

Without specifying a location, indicators across all the locations will be parsed, which may take some time. Thus, make sure to not repeatedly call this function; instead, save the results to a variable.

To get the class of an indicator, use [IndicatorFactory.get\_indicator](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorFactory.get_indicator).

How to get the indicator class

```
vbt.BBANDS  

BBANDS = vbt.IF.get_indicator("pandas_ta:BBANDS")  
BBANDS = vbt.indicator("pandas_ta:BBANDS")  
BBANDS = vbt.IF.from_pandas_ta("BBANDS")  
BBANDS = vbt.pandas_ta("BBANDS")  

RSI = vbt.indicator("RSI")  

```

To get familiar with an indicator class, call [phelp](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.phelp) on the `run` class method, which is used to run the indicator. Alternatively, the specification such as input names is also available via various properties to be accessed in a programmable fashion.

How to get the specification of an indicator class

```
vbt.phelp(vbt.OLS.run)  

print(vbt.OLS.input_names)  
print(vbt.OLS.param_names)  
print(vbt.OLS.param_defaults)  
print(vbt.OLS.in_output_names)  
print(vbt.OLS.output_names)  
print(vbt.OLS.lazy_output_names)  

```

## Running[¶](https://vectorbt.pro/pvt_40509f46/cookbook/indicators/#running "Permanent link")

To run an indicator, call the [IndicatorBase.run](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.run) class method of its class by manually passing the input arrays (which can be any array-like objects such as Pandas DataFrames and NumPy arrays), parameters (which can be single values and lists for testing multiple parameter combinations), and other arguments expected by the indicator. The result of running the indicator is **an indicator instance** (not the actual arrays!).

How to run an indicator

```
bbands = vbt.BBANDS.run(close)  
bbands = vbt.BBANDS.run(open)  
bbands = vbt.BBANDS.run(close, window=20)  
bbands = vbt.BBANDS.run(close, window=vbt.Default(20))  
bbands = vbt.BBANDS.run(close, window=20, hide_params=["window"])  
bbands = vbt.BBANDS.run(close, window=20, hide_params=True)  
bbands = vbt.BBANDS.run(close, window=[10, 20, 30])  
bbands = vbt.BBANDS.run(close, window=[10, 20, 30], alpha=[2, 3, 4])  
bbands = vbt.BBANDS.run(close, window=[10, 20, 30], alpha=[2, 3, 4], param_product=True)  

```

Warning

Testing a wide grid of parameter combinations will produce wide arrays. For example, testing 10000 parameter combinations on one year of daily data would produce an array that takes 30MB of RAM. If the indicator returns three arrays, the RAM consumption would be at least 120MB. One year of minute data would result in staggering 40GB. Thus, for testing wide parameter grids it's recommended to test only a subset of combinations at a time, such as with the use of [parameterization](https://vectorbt.pro/pvt_40509f46/cookbook/optimization#parameterization) or [chunking](https://vectorbt.pro/pvt_40509f46/cookbook/optimization#chunking).

Often, there's a need to make an indicator skip missing values. For this, use `skipna=True`. This argument not only works for TA-Lib indicators but for any indicators, the only requirement: the jitted loop must be disabled. Also, when a two-dimensional input array is passed, you need to additionally pass `split_columns=True` to split its columns and process one column at once.

Run an indicator on valid values only

```
bbands = vbt.BBANDS.run(close_1d, skipna=True)
bbands = vbt.BBANDS.run(close_2d, split_columns=True, skipna=True)

```

Another way is to remove missing values altogether.

Remove missing values in an indicator

```
bbands = bbands.dropna()  
bbands = bbands.dropna(how="all")  

```

To retrieve the output arrays from an indicator instance, either access each as an attribute, or use various unpacking options such as [IndicatorBase.unpack](https://vectorbt.pro/pvt_40509f46/api/indicators/factory/#vectorbtpro.indicators.factory.IndicatorBase.unpack).

How to retrieve output arrays

```
bbands = vbt.talib("BBANDS").run(close)
upperband_df = bbands.upperband  
middleband_df = bbands.middleband
lowerband_df = bbands.lowerband
upperband_df, middleband_df, lowerband_df = bbands.unpack()  
output_dict = bbands.to_dict()  
output_df = bbands.to_frame()  

sma = vbt.talib("SMA").run(close)
sma_df = sma.real  
sma_df = sma.sma  
sma_df = sma.output  
sma_df = sma.unpack()

```

To keep outputs in the NumPy format and/or omit any shape checks, use `return_raw="outputs"`.

Keep NumPy format

```
upperband, middleband, lowerband = vbt.talib("BBANDS").run(close, return_raw="outputs")

```

An even simpler way to run indicators is by using [Data.run](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.run), which takes an indicator name or class, identifies what input names the indicator expects, and then runs the indicator while passing all the inputs found in the data instance automatically. This method also allows unpacking and running multiple indicators, which is very useful for feature engineering.

How to run indicators automatically

```
bbands = data.run("vbt:BBANDS")  
bbands = data.run("vbt:BBANDS", window=20)  
upper, middle, lower = data.run("vbt:BBANDS", unpack=True)  

features_df = data.run(["talib:BBANDS", "talib:RSI"])  
bbands, rsi = data.run(["talib:BBANDS", "talib:RSI"], concat=False)  
features_df = data.run(  
    ["talib:BBANDS", "talib:RSI"], 
    timeperiod=vbt.run_func_dict(talib_bbands=20, talib_rsi=30),
    hide_params=True
)
features_df = data.run(  
    ["talib:BBANDS", "vbt:RSI"], 
    talib_bbands=vbt.run_arg_dict(timeperiod=20),
    vbt_rsi=vbt.run_arg_dict(window=30),
    hide_params=True
)
features_df = data.run("talib_all")  

```

To quickly run and plot a TA-Lib indicator on a single parameter combination without using the indicator factory, use [talib\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/talib_/#vectorbtpro.indicators.talib.talib_func) and [talib\_plot\_func](https://vectorbt.pro/pvt_40509f46/api/indicators/talib_/#vectorbtpro.indicators.talib.talib_plot_func) respectively. In contrast to the official TA-Lib implementation, it can properly handle DataFrames, NaNs, broadcasting, and timeframes. The indicator factory's TA-Lib version is based on these two functions.

Quickly run and plot a TA-Lib indicator

```
run_bbands = vbt.talib_func("BBANDS")
upperband, middleband, lowerband = run_bbands(close, timeperiod=2)
upperband, middleband, lowerband = data.run("talib_func:BBANDS", timeperiod=2)  

plot_bbands = vbt.talib_plot_func("BBANDS")
fig = plot_bbands(upperband, middleband, lowerband)

```

### Parallelization[¶](https://vectorbt.pro/pvt_40509f46/cookbook/indicators/#parallelization "Permanent link")

Parameter combinations are processed using [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute) such that it's fairly easy to parallelize their execution.

Various parallelization configurations

```
any_indicator.run(...)  

# ______________________________________________________________

numba_indicator.run(  
    ...,
    jitted_loop=True,  
    jitted_warmup=True,    
    execute_kwargs=dict(n_chunks="auto", engine="threadpool")
)

# ______________________________________________________________

python_indicator.run(  
    ...,
    execute_kwargs=dict(n_chunks="auto", distribute="chunks", engine="pathos")
)

```

## Registration[¶](https://vectorbt.pro/pvt_40509f46/cookbook/indicators/#registration "Permanent link")

Custom indicators can be registered by the indicator factory to appear in the list of all indicators. This is convenient to be able to refer to the indicator by its name when running a data instance. Upon registration, you can assign the indicator to a custom location (the default location is "custom"), which acts as a tag or group; this can be used to build arbitrary indicator groups. One indicator can be assigned to multiple locations. Custom indicators have priority over built-in indicators.

```
vbt.IF.register_custom_indicator(sma_indicator)  
vbt.IF.register_custom_indicator(sma_indicator, "SMA")  
vbt.IF.register_custom_indicator(sma_indicator, "SMA", location="rolling")  
vbt.IF.register_custom_indicator(sma_indicator, "rolling:SMA")
vbt.IF.register_custom_indicator("talib:sma", location="rolling")  

vbt.IF.deregister_custom_indicator("SMA", location="rolling")  
vbt.IF.deregister_custom_indicator("rolling:SMA")
vbt.IF.deregister_custom_indicator("SMA")  
vbt.IF.deregister_custom_indicator(location="rolling")  
vbt.IF.deregister_custom_indicator()  

```

## Assets[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#assets "Permanent link")

Knowledge assets are instances of [KnowledgeAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset) that hold a list of Python objects (most often dicts) and expose various methods to manipulate them. For usage examples, see the API documentation of the particular method.

### VBT assets[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#vbt-assets "Permanent link")

There are two knowledge assets in VBT: 1) website pages, and 2) Discord messages. The former asset consists of pages and headings that you can find on the (mainly private) website. Each data item represents a page or a heading of a page. Pages usually just point to one or more other pages and/or headings, while headings themselves hold text content - it all reflects the structure of Markdown files. The latter asset consists of the message history of the "vectorbt.pro" Discord server. Here, each data item represents a Discord message that may reference other Discord message(s) through replies.

The assets are attached to each [release](https://github.com/polakowo/vectorbt.pro/releases) as `pages.json.zip` and `messages.json.zip` respectively, which is a ZIP-compressed JSON file. This file is managed by the class [PagesAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/custom_assets/#vectorbtpro.utils.knowledge.custom_assets.PagesAsset) and [MessagesAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/custom_assets/#vectorbtpro.utils.knowledge.custom_assets.MessagesAsset) respectively. It can be either loaded automatically or manually. When loading automatically, GitHub token must be provided.

Hint

The first pull will download the assets, while subsequent pulls will use the cached versions.

How to load an asset

```
env["GITHUB_TOKEN"] = "YOUR_GITHUB_TOKEN"  
pages_asset = vbt.PagesAsset.pull()
messages_asset = vbt.MessagesAsset.pull()

# ______________________________________________________________

vbt.settings.knowledge.assets["vbt"]["token"] = "YOUR_GITHUB_TOKEN" 
pages_asset = vbt.PagesAsset.pull()
messages_asset = vbt.MessagesAsset.pull()

# ______________________________________________________________

pages_asset = vbt.PagesAsset(/MessagesAsset).pull(release_name="v2024.8.20") 
pages_asset = vbt.PagesAsset(/MessagesAsset).pull(cache_dir="my_cache_dir") 
pages_asset = vbt.PagesAsset(/MessagesAsset).pull(clear_cache=True) 
pages_asset = vbt.PagesAsset(/MessagesAsset).pull(cache=False)  

# ______________________________________________________________

pages_asset = vbt.PagesAsset.from_json_file("pages.json.zip") 
messages_asset = vbt.MessagesAsset.from_json_file("messages.json.zip")

```

### Generic assets[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#generic-assets "Permanent link")

Knowledge assets are not limited to VBT assets - you can construct an asset out of any list!

How to load an asset

```
asset = vbt.KnowledgeAsset(my_list)  
asset = vbt.KnowledgeAsset.from_json_file("my_list.json")  
asset = vbt.KnowledgeAsset.from_json_bytes(vbt.load_bytes("my_list.json"))  

```

## Describing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#describing "Permanent link")

Knowledge assets behave like regular lists, thus, to describe an asset, you should describe it as a list. This gives us many analysis options like assessing the length, printing out a random data item, but also more sophisticated options like printing out the field schema - most data items of an asset are dicts, so you can describe them by their fields.

How to describe an asset

```
print(len(asset))  

asset.sample().print()  
asset.print_sample()

asset.print_schema()  

vbt.pprint(messages_asset.describe())  

pages_asset.print_site_schema()  

```

## Manipulating[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#manipulating "Permanent link")

A knowledge asset is just a sophisticated list: it looks like a VBT object but behaves like a list. For manipulation, [KnowledgeAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset) offers a collection of methods that end with `item` or `items` to get, set, or remove data items, either by returning a new asset instance (default) or modifying the asset instance in place.

How to manipulate an asset

```
d = asset.get_items(0)  
d = asset[0]
data = asset[0:100]  
data = asset[mask]  
data = asset[indices]  

# ______________________________________________________________

new_asset = asset.set_items(0, new_d)  
asset.set_items(0, new_d, inplace=True)  
asset[0] = new_d  
asset[0:100] = new_data
asset[mask] = new_data
asset[indices] = new_data

# ______________________________________________________________

new_asset = asset.delete_items(0)  
asset.delete_items(0, inplace=True)
asset.remove(0)
del asset[0]
del asset[0:100]
del asset[mask]
del asset[indices]

# ______________________________________________________________

new_asset = asset.append_item(new_d)  
asset.append_item(new_d, inplace=True)
asset.append(new_d)

# ______________________________________________________________

new_asset = asset.extend_items([new_d1, new_d2])  
asset.extend_items([new_d1, new_d2], inplace=True)
asset.extend([new_d1, new_d2])
asset += [new_d1, new_d2]

# ______________________________________________________________

print(d in asset)  
print(asset.index(d))  
print(asset.count(d))  

# ______________________________________________________________

for d in asset:  
    ...

```

## Querying[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#querying "Permanent link")

There is a zoo of methods to query an asset: [get](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.get) + [select](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.select), [query](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.query) + [filter](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.filter), and [find](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.find). The first pair is used to get and process one to multiple fields from each data item. The `get` method returns the raw output while the `select` method returns a new asset instance. The second pair is used to run queries against the asset using various engines such as JMESPath. And again, the `query` method returns the raw output while the `filter` method returns a new asset instance. Finally, the `find` method is specialized at finding information across one to multiple fields. By default, it returns a new asset instance.

How to query an asset

```
messages = messages_asset.get()  
total_reactions = sum(messages_asset.get("reactions"))  
first_attachments = messages_asset.get("attachments[0]['content']", skip_missing=True)  
first_attachments = messages_asset.get("attachments.0.content", skip_missing=True)  
stripped_contents = pages_asset.get("content", source="x.strip() if x else ''")  
stripped_contents = pages_asset.get("content", source=lambda x: x.strip() if x else '')  
stripped_contents = pages_asset.get(source="content.strip() if content else ''")  



all_contents = pages_asset.select("content").remove_empty().get()  
all_attachments = messages_asset.select("attachments").merge().get()  
combined_content = messages_asset.select(source=vbt.Sub('[$author] $content')).join()  

# ______________________________________________________________

user_questions = messages_asset.query("content if '@polakowo' in mentions else vbt.NoResult")  
is_user_question = messages_asset.query("'@polakowo' in mentions", return_type="bool")  
all_attachments = messages_asset.query("[].attachments | []", query_engine="jmespath")  
all_classes = pages_asset.query("name[obj_type == 'class'].sort_values()", query_engine="pandas")  



support messages = messages_asset.filter("channel == 'support'")  

# ______________________________________________________________

new_messages_asset = messages_asset.find("@polakowo")  
new_messages_asset = messages_asset.find("@polakowo", path="author")  
new_messages_asset = messages_asset.find(vbt.Not("@polakowo"), path="author")  
new_messages_asset = messages_asset.find(  
    ["@polakowo", "from_signals"], 
    path=["author", "content"], 
    find_all=True
)

found_fields = messages_asset.find(  
    ["vbt.Portfolio", "vbt.PF"], 
    return_type="field"
).get()
found_code_matches = messages_asset.find(  
    r"(?<!`)`([^`]*)`(?!`)", 
    mode="regex", 
    return_type="match",
).sort().get()

```

Tip

To make chained calls more readable, use one of the following two styles:

How to find admonition types

```
admonition_types = (
    pages_asset.find(
        r"!!!\s+(\w+)", 
        mode="regex", 
        return_type="match"
    )
    .sort()
    .get()
)
admonition_types = pages_asset.chain([
    ("find", (r"!!!\s+(\w+)",), dict(mode="regex", return_type="match")),
    "sort",
    "get"
])

```

There is a specialized method for finding code, either in single backticks or blocks.

How to find code

```
found_code_blocks = messages_asset.find_code().get()  
found_code_blocks = messages_asset.find_code(language="python").get()  
found_code_blocks = messages_asset.find_code("from_signals").get()  
found_code_blocks = messages_asset.find_code("from_signals", in_blocks=False).get()  
found_code_blocks = messages_asset.find_code("from_signals", path="attachments").get()  

```

Custom knowledge assets like pages and messages also have specialized methods for finding data items by their link. The default behavior is to match the target against the end of each link, such that searching for both "[https://vectorbt.pro/become-a-member/](https://vectorbt.pro/become-a-member/)" and "become-a-member/" will reliably return "[https://vectorbt.pro/become-a-member/](https://vectorbt.pro/become-a-member/)". Also, it automatically adds a variant with the slash or without if either "exact" or "end" mode is used, such that searching for "become-a-member" (without slash) will still return "[https://vectorbt.pro/become-a-member/](https://vectorbt.pro/become-a-member/)". This will also disregard another matched link "[https://vectorbt.pro/become-a-member/#become-a-member](https://vectorbt.pro/become-a-member/#become-a-member)" as it belongs to the same page.

How to find links

```
new_messages_asset = messages_asset.find_link(  
    "https://discord.com/channels/918629562441695344/919715148896301067/923327319882485851"
)
new_messages_asset = messages_asset.find_link("919715148896301067/923327319882485851")  

new_pages_asset = pages_asset.find_page(  
    "https://vectorbt.pro/pvt_xxxxxxxx/getting-started/installation/"
)
new_pages_asset = pages_asset.find_page("https://vectorbt.pro/pvt_40509f46/getting-started/installation/")  
new_pages_asset = pages_asset.find_page("installation/")
new_pages_asset = pages_asset.find_page("installation")  
new_pages_asset = pages_asset.find_page("installation", aggregate=True)  

```

You can also find headings that correspond to VBT objects.

How to find an object

```
new_pages_asset = pages_asset.find_obj(vbt.Portfolio)  
new_pages_asset = pages_asset.find_obj(vbt.Portfolio, aggregate=True)  
new_pages_asset = pages_asset.find_obj(vbt.PF.from_signals, aggregate=True)
new_pages_asset = pages_asset.find_obj(vbt.pf_nb, aggregate=True)
new_pages_asset = pages_asset.find_obj("SignalContext", aggregate=True)

```

## Applying[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#applying "Permanent link")

"Find" and many other methods rely upon [KnowledgeAsset.apply](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.apply), which executes a function on each data item. They are so-called asset functions, which consist of two parts: argument preparation and function calling. The main benefit is that arguments are prepared only once and then passed to each function call. The execution is done via the mighty [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute) function, which is capable of parallelization.

How to apply a function to an asset

```
links = messages_asset.apply("get", "link")  

from vectorbtpro.utils.knowledge.base_asset_funcs import GetAssetFunc  
args, kwargs = GetAssetFunc.prepare("link")
links = [GetAssetFunc.call(d, *args, **kwargs) for d in messages_asset]

# ______________________________________________________________

links_asset = messages_asset.apply(lambda d: d["link"])  
links = messages_asset.apply(lambda d: d["link"], wrap=False)  
json_asset = messages_asset.apply(vbt.dump, dump_engine="json")  

# ______________________________________________________________

new_asset = asset.apply(  
    ...,
    execute_kwargs=dict(
        n_chunks="auto", 
        distribute="chunks", 
        engine="processpool"
    )
)

```

Most examples show how to execute a chain of standalone operations, but each operation passes through data at least once. To pass through data exactly once regardless of the number of operations, use asset pipelines. There are two kinds of asset pipelines: basic and complex. Basic ones take a list of tasks (i.e., functions and their arguments) and compose them into a single operation that takes a single data item. This composed operation is then applied to all data items. Complex ones take a Python expression in a functional programming style where one function receives a data item and returns a result that becomes argument of another function.

How to apply a pipeline to an asset

```
tasks = [("find", ("@polakowo",), dict(return_type="match")), len, "get"]  
tasks = [vbt.Task("find", "@polakowo", return_type="match"), vbt.Task(len), vbt.Task("get")]  
mention_count = messages_asset.apply(tasks)  

asset_pipeline = vbt.BasicAssetPipeline(tasks) 
mention_count = [asset_pipeline(d) for d in messages_asset]

# ______________________________________________________________

expression = "get(len(find(d, '@polakowo', return_type='match')))"
mention_count = messages_asset.apply(expression)  

asset_pipeline = vbt.ComplexAssetPipeline(expression)  
mention_count = [asset_pipeline(d) for d in messages_asset]

```

Info

In both pipelines, arguments are prepared only once during initialization.

## Reducing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#reducing "Permanent link")

[Reducing](https://realpython.com/python-reduce-function/) means merging all data items into one. This requires a function that takes two data items. At first, these two data items are the initializer (such as empty dict) and the first data item. If the initializer is unknown, the first two data items are used. The result of this first iteration is then passed as the first data item to the next iteration. The execution is done by [KnowledgeAsset.reduce](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.reduce) and cannot be parallelized since each iteration depends on the previous one.

How to reduce an asset

```
all_attachments = messages_asset.select("attachments").reduce("merge_lists")  

from vectorbtpro.utils.knowledge.base_asset_funcs import MergeListsAssetFunc  
args, kwargs = MergeListsAssetFunc.prepare()
d1 = []
for d2 in messages_asset.select("attachments"):
    d1 = MergeListsAssetFunc.call(d1, d2, *args, **kwargs)
all_attachments = d1

# ______________________________________________________________

total_reactions = messages_asset.select("reactions").reduce(lambda d1, d2: d1 + d2)  

```

In addition, you can split a knowledge asset into groups and reduce the groups. The iteration over groups is done by the [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute) function, which is capable of parallelization.

How to reduce groups of an asset

```
reactions_by_channel = messages_asset.groupby_reduce(  
    lambda d1, d2: d1 + d2["reactions"], 
    by="channel", 
    initializer=0,
    return_group_keys=True
)

# ______________________________________________________________

result = asset.groupby_reduce(  
    ...,
    execute_kwargs=dict(
        n_chunks="auto", 
        distribute="chunks", 
        engine="processpool"
    )
)

```

## Aggregating[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#aggregating "Permanent link")

Since headings are represented as individual data items, they can be aggregated back into their parent page. This is useful in order to [format](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#formatting) or [display](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#displaying) the page. Note that only headings can be aggregated - pages cannot be aggregated into other pages.

How to aggregate pages

```
new_pages_asset = pages_asset.aggregate()  
new_pages_asset = pages_asset.aggregate(append_obj_type=False, append_github_link=False)  

```

Messages, on the other hand, can be aggregated across multiple levels: _"message"_, _"block"_, _"thread"_, and _"channel"_. Aggregation here simply means taking messages that belong to the specified level, and dumping and putting them into the content of a single, bigger message.

-   The level _"message"_ means that attachments are included in the content of the message.
-   The level _"block"_ puts together messages of the same author that reference the same block or don't reference anything at all. The link of the block is the link of the first message in the block.
-   The level _"thread"_ puts together messages that belong to the same channel and are connected through a chain of replies. The link of the thread is the link of the first message in the thread.
-   The level _"channel"_ puts together messages that belong to the same channel.

How to aggregate messages

```
new_messages_asset = messages_asset.aggregate()  
new_messages_asset = messages_asset.aggregate(by="message")  
new_messages_asset = messages_asset.aggregate(by="block")  
new_messages_asset = messages_asset.aggregate(by="thread")  
new_messages_asset = messages_asset.aggregate(by="channel")  
new_messages_asset = messages_asset.aggregate(  
    ...,
    dump_metadata_kwargs=dict(dump_engine="nestedtext")
)
new_messages_asset = messages_asset.aggregate(  
    ...,
    metadata_format="html", 
    to_html_kwargs=dict(make_links=False)
)

```

## Traversing[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#traversing "Permanent link")

You can also traverse pages and messages similarly to nodes in a graph.

How to traverse an asset

```
new_vbt_asset = vbt_asset.select_previous(link)  
new_vbt_asset = vbt_asset.select_next(link)

# ______________________________________________________________

new_pages_asset = pages_asset.select_parent(link)  
new_pages_asset = pages_asset.select_children(link)
new_pages_asset = pages_asset.select_siblings(link)
new_pages_asset = pages_asset.select_descendants(link)
new_pages_asset = pages_asset.select_branch(link)
new_pages_asset = pages_asset.select_ancestors(link)
new_pages_asset = pages_asset.select_parent_page(link)
new_pages_asset = pages_asset.select_descendant_headings(link)

# ______________________________________________________________

new_messages_asset = messages_asset.select_reference(link)
new_messages_asset = messages_asset.select_replies(link)
new_messages_asset = messages_asset.select_block(link)  
new_messages_asset = messages_asset.select_thread(link)
new_messages_asset = messages_asset.select_channel(link)

```

Note

Each operation requires at least one full data pass; use sparingly.

## Formatting[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#formatting "Permanent link")

Most Python objects can be dumped (i.e., serialized) into strings.

How to dump an asset

```
new_asset = asset.dump()  
new_asset = asset.dump(dump_engine="nestedtext", indent=4)  

# ______________________________________________________________

print(asset.dump().join())  
print(asset.dump().join(separator="\n\n"))  
print(asset.dump_all())  

```

Custom knowledge assets like pages and messages can be converted and optionally saved in Markdown or HTML format. Only the field "content" will be converted while other fields will build the metadata block displayed at the beginning of each file.

Note

Without [aggregation](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#aggregating), each page heading will become a separate file.

How to format an asset

```
new_pages_asset = pages_asset.to_markdown()  
new_pages_asset = pages_asset.to_markdown(root_metadata_key="pages")  
new_pages_asset = pages_asset.to_markdown(clear_metadata=False)  
new_pages_asset = pages_asset.to_markdown(remove_code_title=False, even_indentation=False)  

dir_path = pages_asset.save_to_markdown()  
dir_path = pages_asset.save_to_markdown(cache_dir="markdown")  
dir_path = pages_asset.save_to_markdown(clear_cache=True)  
dir_path = pages_asset.save_to_markdown(cache=False)  



# ______________________________________________________________

new_pages_asset = pages_asset.to_html()  
new_pages_asset = pages_asset.to_html(to_markdown_kwargs=dict(root_metadata_key="pages"))  
new_pages_asset = pages_asset.to_html(make_links=False)  
new_pages_asset = pages_asset.to_html(extensions=[], use_pygments=False)  
extensions = vbt.settings.knowledge.to_html_kwargs["extensions"]
new_pages_asset = pages_asset.to_html(extensions=extensions + ["pymdownx.smartsymbols"])  
vbt.settings.knowledge.to_html_kwargs["extensions"].append("pymdownx.smartsymbols")  
vbt.settings.knowledge.to_html_kwargs["extension_configs"]["pymdownx.superfences"]["preserve_tabs"] = False  
new_pages_asset = pages_asset.to_html(format_html_kwargs=dict(pygments_kwargs=dict(style="dracula")))  
vbt.settings.knowledge.format_html_kwargs["pygments_kwargs"]["style"] = "dracula"  
vbt.settings.knowledge.format_html_kwargs["style_extras"].append("""
.admonition.success {
    background-color: #00c8531a;
    border-left-color: #00c853;
}
""")  
vbt.settings.knowledge.format_html_kwargs["head_extras"].append('<link ...>')  
vbt.settings.knowledge.format_html_kwargs["body_extras"].append('<script>...</script>')  

dir_path = pages_asset.save_to_html()  



```

## Displaying[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#displaying "Permanent link")

Pages and messages can be displayed and browsed through via static HTML files. When a single should be displayed, VBT creates a temporary HTML file and opens it in the default browser. All links in this file remain **external**.

How to display an asset

```
file_path = pages_asset.display()  
file_path = pages_asset.display(link="documentation/fundamentals")  
file_path = pages_asset.display(link="documentation/fundamentals", aggregate=True)  

# ______________________________________________________________

file_path = messages_asset.display()  
file_path = messages_asset.display(link="919715148896301067/923327319882485851")  
file_path = (  
    messages_asset
    .filter("channel == 'announcements'")
    .aggregate(metadata_format="html")
    .display()
)

```

When one or more pages (and/or headings) should be browsed like a website, VBT converts all data items to HTML and replaces all external links to **internal** ones such that you can jump from one page to another locally. But which page is displayed first? Pages and headings build a directed graph. If there's one page from which all other pages are accessible, it's displayed first. If there are multiple pages, VBT creates an index page with metadata blocks from which you can access other pages (unless you specify `entry_link`).

How to browse an asset

```
dir_path = pages_asset.browse()  
dir_path = pages_asset.browse(aggregate=True)  
dir_path = pages_asset.browse(entry_link="documentation/fundamentals", aggregate=True)  
dir_path = pages_asset.browse(entry_link="documentation", descendants_only=True, aggregate=True)  
dir_path = pages_asset.browse(cache_dir="website")  
dir_path = pages_asset.browse(clear_cache=True)  
dir_path = pages_asset.browse(cache=False)  

# ______________________________________________________________

dir_path = messages_asset.browse()  
dir_path = messages_asset.browse(entry_link="919715148896301067/923327319882485851")  



```

## Combining[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#combining "Permanent link")

Assets can be easily combined. When the target class is not specified, their common superclass is used. For example, combining [PagesAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/custom_assets/#vectorbtpro.utils.knowledge.custom_assets.PagesAsset) and [MessagesAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/custom_assets/#vectorbtpro.utils.knowledge.custom_assets.MessagesAsset) will yield an instance of [VBTAsset](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/custom_assets/#vectorbtpro.utils.knowledge.custom_assets.VBTAsset), which is based on overlapping features of both assets, such as "link" and "content" fields.

How to combine multiple assets

```
vbt_asset = pages_asset + messages_asset  
vbt_asset = pages_asset.combine(messages_asset)  
vbt_asset = vbt.VBTAsset.combine(pages_asset, messages_asset)  

```

If both assets have the same number of data items, you can also merge them on the data item level. This works even for complex containers like nested dictionaries and lists by flattening their nested structures into flat dicts, merging them, and then unflattening them back into the original container type.

How to merge multiple assets

```
new_asset = asset1.merge(asset2)  
new_asset = vbt.KnowledgeAsset.merge(asset1, asset2)  

```

You can also merge data items of a single asset into a single data item.

How to merge one asset

```
new_asset = asset.merge()  
new_asset = asset.merge_dicts()  
new_asset = asset.merge_lists()  

```

## Chatting[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#chatting "Permanent link")

Knowledge assets can be used as a context in chatting with LLMs. The method responsible for chatting is [KnowledgeAsset.chat](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.chat), which [dumps](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#formatting) the asset instance, packs it together with your question and chat history into messages, sends them to the LLM service, and displays and persists the response. The response can be displayed in a variety of formats, including raw text, Markdown, and HTML. All three formats support streaming. This method also supports multiple LLM APIs, including OpenAI, LiteLLM, and LLamaIndex.

How to chat about an asset

```
env["OPENAI_API_KEY"] = "YOUR_API_KEY"  

# ______________________________________________________________

patterns_tutorial = pages_asset.find_page( 
    "https://vectorbt.pro/pvt_xxxxxxxx/tutorials/patterns-and-projections/patterns/", 
    aggregate=True
)
patterns_tutorial.chat("How to detect a pattern?")

data_documentation = pages_asset.select_branch("documentation/data").aggregate()  
data_documentation.chat("How to convert DataFrame into vbt.Data?")

pfo_api = pages_asset.find_obj(vbt.PFO, aggregate=True)  
pfo_api.chat("How to rebalance weekly?")

combined_asset = pages_asset + messages_asset
signal_func_nb_code = combined_asset.find_code("signal_func_nb")  
signal_func_nb_code.chat("How to pass an array to signal_func_nb?")

polakowo_messages = messages_asset.filter("author == '@polakowo'").minimize().shuffle()
polakowo_messages.chat("Describe the author of these messages")  

mention_fields = combined_asset.find(
    "parameterize", 
    mode="substring", 
    return_type="field", 
    merge_fields=False
)
mention_counts = combined_asset.find(
    "parameterize", 
    mode="substring", 
    return_type="match", 
    merge_matches=False
).apply(len)
sorted_fields = mention_fields.sort(keys=mention_counts, reverse=True).merge()
sorted_fields.chat("How to parameterize a function?")  

vbt.settings.knowledge.chat["max_tokens"] = None  

# ______________________________________________________________

chat_history = []
signal_func_nb_code.chat("How to check if we're in a long position?", chat_history)  
signal_func_nb_code.chat("How about short one?", chat_history)  
chat_history.clear()  
signal_func_nb_code.chat("How to access close price?", chat_history)

# ______________________________________________________________

asset.chat(..., package="openai", model="o1-mini")  
vbt.settings.knowledge.chat["openai_config"]["model"] = "o1-mini"  

asset.chat(..., package="litellm", model="deepseek/deepseek-coder")
vbt.settings.knowledge.chat["litellm_config"]["model"] = "deepseek/deepseek-coder"

asset.chat(..., package="llama_index", llm="perplexity", model="claude-3-5-sonnet-20240620")
vbt.settings.knowledge.chat["llama_index_config"]["llm"] = "anthropic"  
vbt.settings.knowledge.chat["llama_index_config"]["anthropic"] = {"model": "claude-3-5-sonnet-20240620"}

vbt.settings.knowledge.chat["package"] = "litellm"  

# ______________________________________________________________

asset.chat(..., stream=False)  

asset.chat(..., display_format="plain")  
asset.chat(..., display_format="ipython_markdown")  
asset.chat(..., display_format="ipython_html")  

file_path = asset.chat(..., display_format="html")  
file_path = asset.chat(..., display_format="html", cache_dir="chat")  
file_path = asset.chat(..., display_format="html", clear_cache=True)  
file_path = asset.chat(..., display_format="html", cache=False)  
file_path = asset.chat(  
    ..., 
    display_format="html", 
    to_markdown_kwargs=dict(...),
    to_html_kwargs=dict(...),
    format_html_kwargs=dict(...)
)

asset.chat(..., refresh_rate=1.0)  

asset.chat(..., output_to="response.txt")  

asset.chat(  
    ..., 
    system_prompt="You are a helpful assistant",
    context_prompt="Here's what you need to know: $context"
)

```

## Objects[¶](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#objects "Permanent link")

There are 4 methods to search for an arbitrary VBT object in pages and messages. The first method searches for the API documentation of the object, the second method searches for object mentions in the non-API (human-readable) documentation, the third method searches for object mentions in Discord messages, and the last method searches for object mentions in the code of both pages and messages.

How to find API-related knowledge of an object

```
api_asset = vbt.find_api(vbt.PFO)  
api_asset = vbt.find_api(vbt.PFO, incl_bases=False, incl_ancestors=False)  
api_asset = vbt.find_api(vbt.PFO, use_parent=True)  
api_asset = vbt.find_api(vbt.PFO, use_refs=True)  
api_asset = vbt.find_api(vbt.PFO.row_stack)  
api_asset = vbt.find_api(vbt.PFO.from_uniform, incl_refs=False)  
api_asset = vbt.find_api([vbt.PFO.from_allocate_func, vbt.PFO.from_optimize_func])  

# ______________________________________________________________

api_asset = vbt.PFO.find_api()  
api_asset = vbt.PFO.find_api(attr="from_optimize_func")

```

How to find documentation-related knowledge of an object

```
docs_asset = vbt.find_docs(vbt.PFO)  
docs_asset = vbt.find_docs(vbt.PFO, incl_shortcuts=False, incl_instances=False)  
docs_asset = vbt.find_docs(vbt.PFO, incl_custom=["pf_opt"])  
docs_asset = vbt.find_docs(vbt.PFO, incl_custom=[r"pf_opt\s*=\s*.+"], is_custom_regex=True)  
docs_asset = vbt.find_docs(vbt.PFO, as_code=True)  
docs_asset = vbt.find_docs([vbt.PFO.from_allocate_func, vbt.PFO.from_optimize_func])  

docs_asset = vbt.find_docs(vbt.PFO, up_aggregate_th=0)  
docs_asset = vbt.find_docs(vbt.PFO, up_aggregate_pages=True)  
docs_asset = vbt.find_docs(vbt.PFO, incl_pages=["documentation", "tutorials"])  
docs_asset = vbt.find_docs(vbt.PFO, incl_pages=[r"(features|cookbook)"], page_find_mode="regex")  
docs_asset = vbt.find_docs(vbt.PFO, excl_pages=["release-notes"])  

# ______________________________________________________________

docs_asset = vbt.PFO.find_docs()  
docs_asset = vbt.PFO.find_docs(attr="from_optimize_func")

```

How to find Discord-related knowledge of an object

```
messages_asset = vbt.find_messages(vbt.PFO)  

# ______________________________________________________________

messages_asset = vbt.PFO.find_messages()  
messages_asset = vbt.PFO.find_messages(attr="from_optimize_func")

```

How to find code examples of an object

```
examples_asset = vbt.find_examples(vbt.PFO)  

# ______________________________________________________________

examples_asset = vbt.PFO.find_examples()  
examples_asset = vbt.PFO.find_examples(attr="from_optimize_func")

```

The first three methods are guaranteed to be non-overlapping, while the last method can return examples that can be returned by the first three methods as well. Thus, there is another method that calls the first three methods by default and combines them into a single asset. This way, we can gather all relevant knowledge about a VBT object.

How to combine knowledge about an object

```
combined_asset = vbt.find_assets(vbt.Trades)  
combined_asset = vbt.find_assets(vbt.Trades, asset_names=["api", "docs"])  
combined_asset = vbt.find_assets(vbt.Trades, asset_names=["messages", ...])  
combined_asset = vbt.find_assets(vbt.Trades, asset_names="all")  
combined_asset = vbt.find_assets(  
    vbt.Trades, 
    api_kwargs=dict(incl_ancestors=False),
    docs_kwargs=dict(as_code=True),
    messages_kwargs=dict(as_code=True),
)
combined_asset = vbt.find_assets(vbt.Trades, minimize=False)  
asset_list = vbt.find_assets(vbt.Trades, combine=False)  
combined_asset = vbt.find_assets([vbt.EntryTrades, vbt.ExitTrades])  

# ______________________________________________________________

combined_asset = vbt.find_assets("SQL", resolve=False)  
combined_asset = vbt.find_assets(["SQL", "database"], resolve=False)  

# ______________________________________________________________

messages_asset = vbt.Trades.find_assets()  
messages_asset = vbt.Trades.find_assets(attr="plot")
messages_asset = pf.trades.find_assets(attr="expectancy")

```

How to browse combined knowledge about an object

```
vbt.Trades.find_assets().select("link").print()  

dir_path = vbt.Trades.find_assets( 
    asset_names="docs", 
    docs_kwargs=dict(excl_pages="release-notes")
).browse(cache=False)

```

Finally, we can chat about a VBT object. Under the hood, it calls the method above, but on code examples only. When passing arguments, they are automatically distributed between [find\_assets](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/custom_assets/#vectorbtpro.utils.knowledge.custom_assets.find_assets) and [KnowledgeAsset.chat](https://vectorbt.pro/pvt_40509f46/api/utils/knowledge/base_assets/#vectorbtpro.utils.knowledge.base_assets.KnowledgeAsset.chat) (see [chatting](https://vectorbt.pro/pvt_40509f46/cookbook/knowledge/#chatting) for recipes)

How to chat about an object

```
vbt.chat_about(vbt.Portfolio, "How to get trading expectancy?")  
vbt.chat_about(  
    vbt.Portfolio, 
    "How to get returns accessor with log returns?", 
    asset_names="api",
    api_kwargs=dict(incl_bases=False, incl_ancestors=False)
)
vbt.chat_about(  
    vbt.Portfolio, 
    "How to backtest a basic strategy?", 
    model="o1-mini",
    system_as_user=True,
    max_tokens=100_000,
    shuffle=True
)

# ______________________________________________________________

vbt.Portfolio.chat("How to create portfolio from order records?")  
vbt.Portfolio.chat("How to get grouped stats?", attr="stats")

```

But you can also ask a question about objects that technically do not exist in VBT, or keywords in general, such as "quantstats", which will search for mentions of "quantstats" in pages and messages.

How to chat about anything

```
vbt.chat_about(
    "sql", 
    "How to import data from a SQL database?", 
    resolve=False,  
    find_kwargs=dict(
        ignore_case=True,
        allow_prefix=True,  
        allow_suffix=True  
    )
)

```


Optimization involves executing a function on a set of various configurations with an aim to optimize the performance of a strategy, and/or to optimize the CPU or RAM performance of a pipeline.

## Parameterization[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#parameterization "Permanent link")

The first and easiest approach revolves around testing a single parameter combination at a time, which utilizes as little RAM as possible but may take longer to run if the function isn't written in pure Numba and has a fixed overhead (e.g., conversion from Pandas to NumPy and back) that adds to the total execution time with each run. For this, create a pipeline function that runs a set of single values and decorate it with [`@vbt.parameterized`](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.parameterized). To test multiple parameters, wrap each parameter argument with [Param](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.Param).

### Decoration[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#decoration "Permanent link")

To parameterize any function, we have to decorate (or wrap) it with `@vbt.parameterized`. This will return a new function with the same name and arguments as the original one. The only difference: this new function will process passed arguments, build parameter combinations, call the original function on each parameter combination, and merge the results of all combinations.

Process only one parameter combination at a time

```
@vbt.parameterized
def my_pipeline(data, fast_window, slow_window):  
    ...
    return result  

results = my_pipeline(  
    data,
    vbt.Param(fast_windows),  
    vbt.Param(slow_windows)
)

```

To keep the original function separate from the decorated one, we can decorate it after it has been defined and give the decorated function another name.

Decorate a function later

```
def my_pipeline(data, fast_window, slow_window):
    ...
    return result

my_param_pipeline = vbt.parameterized(my_pipeline)
results = my_param_pipeline(...)

```

### Merging[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#merging "Permanent link")

The code above returns a list of results, one per parameter combination. To return the grid of parameter combinations as well, pass `return_param_index=True` to the decorator. Alternatively, let VBT merge the results into one or more Pandas objects and attach the grid to their index or columns by specifying the merging function (see [resolve\_merge\_func](https://vectorbt.pro/pvt_40509f46/api/base/reshaping/#vectorbtpro.base.merging.resolve_merge_func)).

Various merging configurations

```
@vbt.parameterized(return_param_index=True)  
def my_pipeline(...):
    ...
    return result

results, param_index = my_pipeline(...)

# ______________________________________________________________

@vbt.parameterized(merge_func="concat")  
def my_pipeline(...):
    ...
    return pf.sharpe_ratio

sharpe_ratio = my_pipeline(...)

# ______________________________________________________________

@vbt.parameterized(merge_func="concat")
def my_pipeline(...):
    ...
    return pf.sharpe_ratio, pf.win_rate

sharpe_ratio, win_rate = my_pipeline(...)

# ______________________________________________________________

@vbt.parameterized(merge_func="column_stack")  
def my_pipeline(...):
    ...
    return entries, exits

entries, exits = my_pipeline(...)

# ______________________________________________________________

@vbt.parameterized(merge_func="row_stack")  
def my_pipeline(...):
    ...
    return pf.value

value = my_pipeline(...)

# ______________________________________________________________

@vbt.parameterized(merge_func=("concat", "column_stack"))  
def my_pipeline(...):
    ...
    return pf.sharpe_ratio, pf.value

sharpe_ratio, value = my_pipeline(...)

# ______________________________________________________________

def merge_func(results, param_index):
    return pd.Series(results, index=param_index)

@vbt.parameterized(
    merge_func=merge_func,  
    merge_kwargs=dict(param_index=vbt.Rep("param_index"))  
)
def my_pipeline(...):
    ...
    return pf.sharpe_ratio

sharpe_ratio = my_pipeline(...)

```

We can also use annotations to specify the merging function(s).

```
@vbt.parameterized
def my_pipeline(...) -> "concat":  
    ...
    return result

# ______________________________________________________________

@vbt.parameterized
def my_pipeline(...) -> ("concat", "column_stack"):  
    ...
    return result1, result2

# ______________________________________________________________

@vbt.parameterized
def my_pipeline(...) -> (  
    vbt.MergeFunc("concat", wrap=False), 
    vbt.MergeFunc("column_stack", wrap=False)
):
    ...
    return result1, result2

```

### Generation[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#generation "Permanent link")

The grid of parameter combinations can be controlled by individual parameters. By default, vectorbtpro will build a Cartesian product of all parameters. To avoid building the product between some parameters, they can be assigned to the same product `level`. To filter out unwanted parameter configurations, specify the `condition` as a boolean expression where variables are parameter names. Such a condition will be evaluated on each parameter combination, and if it returns True, the combination will be kept. To change the appearance of a parameter in the parameter index, `keys` with human-readable strings can be provided. A parameter can also be hidden entirely by setting `hide=True`.

Various parameter configurations

```
sma_crossover(  
    data=data,
    fast_window=vbt.Param(windows, condition="fast_window < slow_window"),
    slow_window=vbt.Param(windows),
)

# ______________________________________________________________

sma_crossover(  
    data=vbt.Param(data),
    fast_window=vbt.Param(windows, condition="fast_window < slow_window"),
    slow_window=vbt.Param(windows),
)

# ______________________________________________________________

from itertools import combinations

fast_windows, slow_windows = zip(*combinations(windows, 2))  
sma_crossover(
    data=vbt.Param(data, level=0),
    fast_window=vbt.Param(fast_windows, level=1),
    slow_window=vbt.Param(slow_windows, level=1),
)

# ______________________________________________________________

bbands_indicator(  
    data=data,
    timeperiod=vbt.Param(timeperiods, level=0),
    upper_threshold=vbt.Param(thresholds, level=1, keys=pd.Index(thresholds, name="threshold")),
    lower_threshold=vbt.Param(thresholds, level=1, hide=True),
    _random_subset=1_000  
)

```

Warning

Testing 6 parameters with only 10 values each would generate staggering 1 million parameter combinations, thus make sure that your grids are not too wide, otherwise the generation part alone will take forever to run. This warning doesn't apply when you use `random_subset` though; in this case, VBT won't build the full grid but select random combinations dynamically. See an example in [Lazy parameter grids](https://vectorbt.pro/pvt_40509f46/features/optimization/#lazy-parameter-grids).

We can also use annotations to specify which arguments are parameters and their default configuration.

Calculate the SMA crossover for one parameter combination at a time

```
@vbt.parameterized
def sma_crossover(
    data,
    fast_window: vbt.Param(condition="fast_window < slow_window"),
    slow_window: vbt.Param,
) -> "column_stack":
    fast_sma = data.run("talib:sma", fast_window, unpack=True)
    slow_sma = data.run("talib:sma", slow_window, unpack=True)
    upper_crossover = fast_sma.vbt.crossed_above(slow_sma)
    lower_crossover = fast_sma.vbt.crossed_below(slow_sma)
    signals = upper_crossover | lower_crossover
    return signals

signals = sma_crossover(data, fast_windows, slow_windows)

```

#### Pre-generation[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#pre-generation "Permanent link")

To get the generated parameter combinations before (or without) calling the `@vbt.parameterized` decorator, we can pass the same parameters to [combine\_params](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.combine_params).

Pre-generate parameter combinations

```
param_product, param_index = vbt.combine_params(
    fast_window=vbt.Param(windows, condition="fast_window < slow_window"),
    slow_window=vbt.Param(windows)
)

# ______________________________________________________________

param_product = vbt.combine_params(
    fast_window=vbt.Param(windows, condition="fast_window < slow_window"),
    slow_window=vbt.Param(windows),
    build_index=False  
)

```

### Execution[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#execution "Permanent link")

Each parameter combination involves one call of the pipeline function. To perform multiple calls in parallel, pass a dictionary named `execute_kwargs` with keyword arguments that should be forwarded to the function [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute), which takes care of chunking and executing the function calls.

Various execution configurations

```
@vbt.parameterized  
def my_pipeline(...):
    ...

# ______________________________________________________________

@vbt.parameterized(execute_kwargs=dict(chunk_len="auto", engine="threadpool"))  
@njit(nogil=True)
def my_pipeline(...):
    ...

# ______________________________________________________________

@vbt.parameterized(execute_kwargs=dict(n_chunks="auto", distribute="chunks", engine="pathos"))  
def my_pipeline(...):
    ...

# ______________________________________________________________

@vbt.parameterized  
@njit(nogil=True)
def my_pipeline(...):
    ...

my_pipeline(
    ...,
    _execute_kwargs=dict(chunk_len="auto", engine="threadpool")
)

# ______________________________________________________________

@vbt.parameterized(execute_kwargs=dict(show_progress=False))  
@njit(nogil=True)
def my_pipeline(...):
    ...

my_pipeline(
    ...,
    _execute_kwargs=dict(chunk_len="auto", engine="threadpool")  
)
my_pipeline(
    ...,
    _execute_kwargs=vbt.atomic_dict(chunk_len="auto", engine="threadpool")  
)

```

Note

Threads are easier and faster to spawn than processes. Also, to execute a function in its own process, all the passed inputs and parameters need to be serialized and then deserialized, which takes time. Thus, multithreading is preferred, but it requires the function to release the GIL, which means either compiling the function with Numba and setting the `nogil` flag to True, or using exclusively NumPy.

If this isn't possible, use multiprocessing but make sure that the function either doesn't take large arrays, or that one parameter combination takes a considerable amount of time to run. Otherwise, you may find parallelization making the execution even slower.

To run a code before/after the entire processing or even before/after each individual chunk, [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute) offers a number of callbacks.

Clear cache and collect garbage once in 3 chunks

```
def post_chunk_func(chunk_idx, flush_every):
    if (chunk_idx + 1) % flush_every == 0:
        vbt.flush()

@vbt.parameterized(
    post_chunk_func=post_chunk_func,
    post_chunk_kwargs=dict(
        chunk_idx=vbt.Rep("chunk_idx", eval_id="post_chunk_kwargs"), 
        flush_every=3
    ),
    chunk_len=10  
)  
def my_pipeline(...):
    ...

```

Tip

This works not only with `@vbt.parameterized` but also with other functions that use [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute) with chunking!

### Total or partial?[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#total-or-partial "Permanent link")

Often, you should make a decision whether your pipeline should be parameterized totally or partially. Total parameterization means running the entire pipeline on each parameter combination, which is the easiest but also the most suitable approach if you have parameters being applied across multiple components of the pipeline, and/or if you want to trade in faster processing for lower memory consumption.

Parameterize an entire MA crossover pipeline

```
@vbt.parameterized(merge_func="concat")  
def ma_crossover_sharpe(data, fast_window, slow_window):
    fast_ma = data.run("vbt:ma", window=fast_window, hide_params=True)
    slow_ma = data.run("vbt:ma", window=slow_window, hide_params=True)
    entries = fast_ma.ma_crossed_above(slow_ma)
    exits = fast_ma.ma_crossed_below(slow_ma)
    pf = vbt.PF.from_signals(data, entries, exits)
    return pf.sharpe_ratio

ma_crossover_sharpe(
    data, 
    vbt.Param(fast_windows, condition="fast_window < slow_window"), 
    vbt.Param(slow_windows)
)

```

Partial parameterization, on the other hand, is appropriate if you have only a few components in the pipeline where parameters are being applied, and if the remaining components of the pipeline know how to work with the results from the parameterized components. This may lead to a faster execution but also a higher memory consumption.

Parameterize only the signal part of a MA crossover pipeline

```
@vbt.parameterized(merge_func="column_stack")  
def ma_crossover_signals(data, fast_window, slow_window):
    fast_ma = data.run("vbt:ma", window=fast_window, hide_params=True)
    slow_ma = data.run("vbt:ma", window=slow_window, hide_params=True)
    entries = fast_ma.ma_crossed_above(slow_ma)
    exits = fast_ma.ma_crossed_below(slow_ma)
    return entries, exits

def ma_crossover_sharpe(data, fast_windows, slow_windows):
    entries, exits = ma_crossover_signals(data, fast_windows, slow_windows)  
    pf = vbt.PF.from_signals(data, entries, exits)  
    return pf.sharpe_ratio

ma_crossover_sharpe(
    data, 
    vbt.Param(fast_windows, condition="fast_window < slow_window"), 
    vbt.Param(slow_windows)
)

```

### Flat or nested?[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#flat-or-nested "Permanent link")

Another decision you should make is whether to handle all parameters by one decorator (flat parameterization) or distribute parameters across multiple decorators to implement a specific parameter hierarchy (nested parameterization). The former approach should be used if you want to treat all of your parameters equally and put them into the same bucket for generation and processing. In this case, the order of the parameters in combinations is defined by the order the parameters are passed to the function. For example, while the values of the first parameter will be processed strictly from the first to the last value, the values of any other parameter will be rotated.

Process all parameters at the same time in a MA crossover pipeline

```
@vbt.parameterized(merge_func="concat")  
def ma_crossover_sharpe(data, symbol, fast_window, slow_window):
    symbol_data = data.select(symbol)  
    fast_ma = symbol_data.run("vbt:ma", window=fast_window, hide_params=True)
    slow_ma = symbol_data.run("vbt:ma", window=slow_window, hide_params=True)
    entries = fast_ma.ma_crossed_above(slow_ma)
    exits = fast_ma.ma_crossed_below(slow_ma)
    pf = vbt.PF.from_signals(symbol_data, entries, exits)
    return pf.sharpe_ratio

ma_crossover_sharpe(
    data, 
    vbt.Param(data.symbols), 
    vbt.Param(fast_windows, condition="fast_window < slow_window"), 
    vbt.Param(slow_windows),
)

```

The latter approach should be used if you want to define your own custom parameter hierarchy. For example, you may want to execute (such as parallelize) certain parameters differently, or you may want to reduce the number of invocations of certain parameters, or you may want to introduce special preprocessing and/or postprocessing to certain parameters.

First process symbols and then windows in a MA crossover pipeline

```
@vbt.parameterized(merge_func="concat", eval_id="inner")  
def symbol_ma_crossover_sharpe(symbol_data, fast_window, slow_window):
    fast_ma = symbol_data.run("vbt:ma", window=fast_window, hide_params=True)
    slow_ma = symbol_data.run("vbt:ma", window=slow_window, hide_params=True)
    entries = fast_ma.ma_crossed_above(slow_ma)
    exits = fast_ma.ma_crossed_below(slow_ma)
    pf = vbt.PF.from_signals(symbol_data, entries, exits)
    return pf.sharpe_ratio

@vbt.parameterized(merge_func="concat", eval_id="outer")  
def ma_crossover_sharpe(data, symbol, fast_windows, slow_windows):
    symbol_data = data.select(symbol)  
    return symbol_ma_crossover_sharpe(symbol_data, fast_windows, slow_windows)  

ma_crossover_sharpe(  
    data, 
    vbt.Param(data.symbols, eval_id="outer"),
    vbt.Param(fast_windows, eval_id="inner", condition="fast_window < slow_window"),
    vbt.Param(slow_windows, eval_id="inner")
)

# ______________________________________________________________

@vbt.parameterized(merge_func="concat", eval_id="outer")
@vbt.parameterized(merge_func="concat", eval_id="inner")
def ma_crossover_sharpe(data, fast_window, slow_window):  
    fast_ma = data.run("vbt:ma", window=fast_window, hide_params=True)
    slow_ma = data.run("vbt:ma", window=slow_window, hide_params=True)
    entries = fast_ma.ma_crossed_above(slow_ma)
    exits = fast_ma.ma_crossed_below(slow_ma)
    pf = vbt.PF.from_signals(data, entries, exits)
    return pf.sharpe_ratio

ma_crossover_sharpe(
    vbt.Param(data, eval_id="outer"),
    vbt.Param(fast_windows, eval_id="inner", condition="fast_window < slow_window"),
    vbt.Param(slow_windows, eval_id="inner")
)

```

### Skipping[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#skipping "Permanent link")

Parameter combinations can be skipped dynamically by returning [NoResult](https://vectorbt.pro/pvt_40509f46/api/utils/params/#vectorbtpro.utils.params.NoResult) instead of the actual result.

Skip the parameter combination if an error occurred

```
@vbt.parameterized
def my_pipeline(data, fast_window, slow_window):
    try:
        ...
        return result
    except Exception:
        return vbt.NoResult

results = my_pipeline(
    data,
    vbt.Param(fast_windows),
    vbt.Param(slow_windows)
)

```

## Hybrid (mono-chunks)[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#hybrid-mono-chunks "Permanent link")

The approach above calls the original function on each single parameter combination, which makes it slow when dealing with a large number of combinations, especially when each function call is associated with an overhead, such as when NumPy array gets converted to a Pandas object. Remember that 1 millisecond of an overhead translates into 17 minutes of additional execution time for one million of combinations.

There's nothing (apart from parallelization) we can do to speed up functions that take only one combination at a time. But if the function can be adapted to accept multiple combinations, where each parameter argument becomes an array instead of a single value, we can instruct `@vbt.parameterized` to merge all combinations into chunks and call the function on each chunk. This way, we can reduce the number of function calls significantly.

Test a grid of parameters using mono-chunks

```
@vbt.parameterized(mono_n_chunks=?, mono_chunk_len=?, mono_chunk_meta=?)  
def my_pipeline(data, fast_windows, slow_windows):  
    ...
    return result  

results = my_pipeline(  
    data,
    vbt.Param(fast_windows),
    vbt.Param(slow_windows)
)

# ______________________________________________________________

@vbt.parameterized(mono_n_chunks="auto")  
...

# ______________________________________________________________

@vbt.parameterized(mono_chunk_len=100)  
...

```

By default, parameter values are passed as lists to the original function. To pass them as arrays or in any other format instead, set a merging function `mono_merge_func` for each parameter.

```
my_pipeline(
    param_a=vbt.Param(param_a),  
    param_b=vbt.Param(param_b, mono_reduce=True),  
    param_c=vbt.Param(param_c, mono_merge_func="concat"),  
    param_d=vbt.Param(param_d, mono_merge_func="row_stack"),  
    param_e=vbt.Param(param_e, mono_merge_func="column_stack"),  
    param_f=vbt.Param(param_f, mono_merge_func=vbt.MergeFunc(...))  
)

```

Execution is done in the same way as in [Parameterization](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#parameterization) and chunks can be easily parallelized, just keep an eye on RAM consumption since now multiple parameter combinations are executed at the same time.

## Chunking[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#chunking "Permanent link")

Chunking revolves around splitting a value (such as an array) of one or more arguments into many parts (or chunks), calling the function on each part, and then merging all parts together. This way, we can instruct VBT to process only a subset of data at a time, which is helpful in both reducing RAM consumption and increasing performance by utilizing parallelization. Chunking is also highly convenient: usually, you don't have to change your function in any way, and you'll get the same results regardless of whether chunking was enabled or disabled. To use chunking, create a pipeline function, decorate it with [`@vbt.chunked`](https://vectorbt.pro/pvt_40509f46/api/utils/chunking/#vectorbtpro.utils.chunking.chunked), and specify how exactly arguments should be chunked and results should be merged.

### Decoration[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#decoration_1 "Permanent link")

To make any function chunkable, we have to decorate (or wrap) it with `@vbt.chunked`. This will return a new function with the same name and arguments as the original one. The only difference: this new function will process passed arguments, chunk the arguments, call the original function on each chunk of the arguments, and merge the results of all chunks.

Process only a subset of values at a time

```
@vbt.chunked
def my_pipeline(data, fast_windows, slow_windows):  
    ...
    return result  

results = my_pipeline(  
    data,
    vbt.Chunked(fast_windows),  
    vbt.Chunked(slow_windows)
)

```

To keep the original function separate from the decorated one, we can decorate it after it has been defined and give the decorated function another name.

Decorate a function later

```
def my_pipeline(data, fast_windows, slow_windows):
    ...
    return result

my_chunked_pipeline = vbt.chunked(my_pipeline)
results = my_chunked_pipeline(...)

```

### Specification[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#specification "Permanent link")

To chunk an argument, we must provide a chunking specification for that argument. There are three main ways on how to provide such a specification.

Approach 1: Pass a dictionary `arg_take_spec` to the decorator. The most capable approach as it allows chunking of any nested objects of arbitrary depths, such as lists inside lists.

Specify chunking rules via arg\_take\_spec

```
@vbt.chunked(
    arg_take_spec=dict(  
        array1=vbt.ChunkedArray(axis=1),  
        array2=vbt.ChunkedArray(axis=1),
        combine_func=vbt.NotChunked  
    ),
    size=vbt.ArraySizer(arg_query="array1", axis=1),  
    merge_func="column_stack"  
)
def combine_arrays(array1, array2, combine_func):
    return combine_func(array1, array2)

new_array = combine_arrays(array1, array2, np.add)

```

Approach 2: Annotate the function. The most convenient approach as you can specify chunking rules next to their respective arguments directly in the function definition.

Specify chunking rules via annotations

```
@vbt.chunked
def combine_arrays(
    array1: vbt.ChunkedArray(axis=1) | vbt.ArraySizer(axis=1),  
    array2: vbt.ChunkedArray(axis=1), 
    combine_func
) -> "column_stack":
    return combine_func(array1, array2)

new_array = combine_arrays(array1, array2, np.add)

```

Approach 3: Wrap argument values directly. Allows switching chunking rules on the fly.

Specify chunking rules via argument values

```
@vbt.chunked
def combine_arrays(array1, array2, combine_func):
    return combine_func(array1, array2)

new_array = combine_arrays(  
    vbt.ChunkedArray(array1), 
    vbt.ChunkedArray(array2), 
    np.add,
    _size=len(array1),  
    _merge_func="concat"
)
new_array = combine_arrays(  
    vbt.ChunkedArray(array1, axis=0), 
    vbt.ChunkedArray(array2, axis=0), 
    np.add,
    _size=array1.shape[0],
    _merge_func="row_stack"
)
new_array = combine_arrays(  
    vbt.ChunkedArray(array1, axis=1), 
    vbt.ChunkedArray(array2, axis=1), 
    np.add,
    _size=array1.shape[1],
    _merge_func="column_stack"
)

```

Merging and execution are done in the same way as in [Parameterization](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#parameterization).

## Hybrid (super-chunks)[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#hybrid-super-chunks "Permanent link")

[Parameterized decorator](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#parameterization) and chunked decorator can be combined to process only a subset of parameter combinations at a time without the need of changing the function's design as in [Hybrid (mono-chunks)](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#hybrid-mono-chunks). Even though super-chunking may not be as fast as mono-chunking, it's still beneficiary when you want to process only a subset of parameter combinations at a time (but not all, otherwise, you should just use `distribute="chunks"` in the parameterized decorator without a chunked decorator) to keep RAM consumption in check, or when you want do some preprocessing and/or postprocessing such as flushing per bunch of parameter combinations.

Execute at most n parameter combinations per process

```
@vbt.parameterized
def my_pipeline(data, fast_window, slow_window):  
    ...
    return result

@vbt.chunked(
    chunk_len=?,  
    execute_kwargs=dict(chunk_len="auto", engine="pathos")  
)
def chunked_pipeline(data, fast_windows, slow_windows):  
    return my_pipeline(
        data, 
        vbt.Param(fast_windows, level=0), 
        vbt.Param(slow_windows, level=0)
    )

param_product = vbt.combine_params({  
    "fast_windows": fast_windows, 
    "slow_windows": slow_windows
}, build_index=False)

chunked_pipeline(
    data,
    vbt.Chunked(param_product["fast_windows"]), 
    vbt.Chunked(param_product["slow_windows"])
)

```

## Raw execution[¶](https://vectorbt.pro/pvt_40509f46/cookbook/optimization/#raw-execution "Permanent link")

Whenever VBT needs to execute one function on multiple sets of arguments, it uses the function [execute](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.execute), which takes a list of tasks (functions and their arguments) and executes them with an engine selected by the user. This function takes all the same arguments that you usually pass inside `execute_kwargs`.

Execute multiple indicator configurations in parallel

```
sma_func = vbt.talib_func("sma")
ema_func = vbt.talib_func("ema")
tasks = [
    vbt.Task(sma_func, arr, 10),  
    vbt.Task(sma_func, arr, 20),
    vbt.Task(ema_func, arr, 10),
    vbt.Task(ema_func, arr, 20),
]
keys = pd.MultiIndex.from_tuples([  
    ("sma", 10),
    ("sma", 20),
    ("ema", 10),
    ("ema", 20),
], names=["indicator", "timeperiod"])

indicators_df = vbt.execute(  
    tasks, 
    keys=keys, 
    merge_func="column_stack",
    engine="threadpool"
)

```

If you want to parallelize a workflow within a for-loop, put it into a function and decorate that function with [iterated](https://vectorbt.pro/pvt_40509f46/api/utils/execution/#vectorbtpro.utils.execution.iterated). Then, when executing the decorated function, pass a total number of iterations or a range in place of the argument where you expect the iteration variable.

Execute a regular for-loop in parallel

```
# ______________________________ FROM ______________________________

results = []
keys = []
for timeperiod in range(20, 50, 5):
    result = sma_func(arr, timeperiod)
    results.append(result)
    keys.append(timeperiod)
keys = pd.Index(keys, name="timeperiod")
sma_df = pd.concat(map(pd.Series, results), axis=1, keys=keys)

# ______________________________ TO ______________________________

@vbt.iterated(over_arg="timeperiod", merge_func="column_stack", engine="threadpool")
def sma(arr, timeperiod):
    return sma_func(arr, timeperiod)

sma = vbt.iterated(  
    sma_func, 
    over_arg="timeperiod", 
    engine="threadpool", 
    merge_func="column_stack"
)

sma_df = sma(arr, range(20, 50, 5))

```

Execute a nested for-loop in parallel

```
# ______________________________ FROM ______________________________

results = []
keys = []
for fast_window in range(20, 50, 5):
    for slow_window in range(20, 50, 5):
        if fast_window < slow_window:
            fast_sma = sma_func(arr, fast_window)
            slow_sma = sma_func(arr, slow_window)
            result = fast_sma - slow_sma
            results.append(result)
            keys.append((fast_window, slow_window))
keys = pd.MultiIndex.from_tuples(keys, names=["fast_window", "slow_window"])
sma_diff_df = pd.concat(map(pd.Series, results), axis=1, keys=keys)

# ______________________________ TO ______________________________

@vbt.iterated(over_arg="fast_window", merge_func="column_stack", engine="pathos")  
@vbt.iterated(over_arg="slow_window", merge_func="column_stack", raise_no_results=False)
def sma_diff(arr, fast_window, slow_window):
    if fast_window >= slow_window:
        return vbt.NoResult
    fast_sma = sma_func(arr, fast_window)
    slow_sma = sma_func(arr, slow_window)
    return fast_sma - slow_sma

sma_diff_df = sma_diff(arr, range(20, 50, 5), range(20, 50, 5))

```

Any Python object can be serialized and saved to disk as a pickle file with [save](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.save).

Save a dict to a file

```
cache = dict(data=data, indicator=indicator, pf=pf)
vbt.save(cache, "cache.pickle")

```

Important

If a file with the same name already exists, it will be overridden.

A pickle file can then be loaded back and deserialized with [load](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.load).

Load the dict back

```
cache = vbt.load("cache.pickle")

```

Note

The file can be read in another Python environment and even on another machine (such as in cloud), just make sure that the Python and package versions on both ends are approximately the same.

Pickle files usually take a considerable amount of space, to reduce it compression can be used. The most recommended compression algorithm for binary files is [blosc](https://github.com/Blosc/c-blosc). To later load the compressed file, pass the `compression` argument in the exact same way to the loader, or simply append the ".blosc" extension to the filename for the loader to recognize it automatically. The supported algorithms and their possible extensions are listed under `extensions` in [settings.pickling](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.pickling).

Specify the compression explicitly

```
vbt.save(cache, "cache.pickle", compression="blosc")
cache = vbt.load("cache.pickle", compression="blosc")

```

Specify the compression implicitly

```
vbt.save(cache, "cache.pickle.blosc")
cache = vbt.load("cache.pickle.blosc")

```

Those VBT objects that subclass [Pickleable](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.Pickleable) can also be saved individually. Benefit: the name of the class and optionally the compression algorithm will be packed into the filename by default to simplify loading. The object can be loaded back using the `load()` method of the object's class.

Save a portfolio under 'Portfolio.pickle.blosc' and load it back

```
pf.save(compression="blosc")
pf = vbt.PF.load()

```

If a VBT object was saved with an older package version and upon loading with a newer version an error is thrown (for example, due to a different order of the arguments), the object can still be reconstructed by creating and registering a [RecInfo](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.RecInfo) instance before loading.

Reconstruct an older BinanceData instance

```
def modify_state(rec_state):  
    return vbt.RecState(
        init_args=rec_state.init_args,
        init_kwargs=rec_state.init_kwargs,
        attr_dct=rec_state.attr_dct,
    )

rec_info = vbt.RecInfo(
    vbt.get_id_from_class(vbt.BinanceData),
    vbt.BinanceData,
    modify_state
)
rec_info.register()
data = vbt.BinanceData.load()

```

If there are issues with saving an instance of a specific class, set the reconstruction id `_rec_id` with any string and then reconstruct the object using this id (first argument of `RecInfo`).

Set a custom identifier to a class and reconstruct its instance using another class

```
class MyClass1(vbt.Configured):  
    _rec_id = "MyClass"
    ...

my_obj = MyClass1()
vbt.save(my_obj, "my_obj")



class MyClass2(vbt.Configured):
    ...

rec_info = vbt.RecInfo("MyClass", MyClass2)
rec_info.register()
my_obj = vbt.load("my_obj")  

```

Any Pandas Series or DataFrame can be plotted via an accessor. There are two main pathways for plotting:

1.  [GenericAccessor](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor) offering methods tailored specifically for vectorbtpro-typical workflows, and
2.  [PXAccessor](https://vectorbt.pro/pvt_40509f46/api/px/accessors/#vectorbtpro.px.accessors.PXAccessor) offering methods parsed from [Plotly express](https://plotly.com/python/plotly-express/).

How to plot a Pandas object

```
fig = sr_or_df.vbt.plot()  

fig = pd.Series(
    np.asarray(y), 
    index=np.asarray(x)
).vbt.scatterplot()  
fig = pf.value.vbt.lineplot()  
fig = pf.sharpe_ratio.vbt.barplot()  
fig = pf.returns.vbt.qqplot()  
fig = pf.allocations.vbt.areaplot(line_shape="hv")  
fig = pf.returns.vbt.histplot(trace_kwargs=dict(nbinsx=100))  

monthly_returns = pf.returns_acc.resample("M").get()
fig = monthly_returns.vbt.boxplot()   
fig = monthly_returns.vbt.heatmap()  
fig = monthly_returns.vbt.ts_heatmap()  

fig = pf.sharpe_ratio.vbt.heatmap(  
    x_level="fast_window", 
    y_level="slow_window",
    symmetric=True
)
fig = pf.sharpe_ratio.vbt.heatmap(  
    x_level="fast_window", 
    y_level="slow_window",
    slider_level="symbol",
    symmetric=True
)
fig = pf.sharpe_ratio.vbt.volume(  
    x_level="timeperiod", 
    y_level="upper_threshold",
    z_level="lower_threshold",
    symmetric=True
)

# ______________________________________________________________

fig = sr_or_df.vbt.px.ecdf()  

```

To plot multiple things over the same figure, get the figure from the first plotting method and pass it to each subsequent one.

Plot equity lines of two portfolios in the same figure

```
fig = pf1.value.vbt.lineplot()
fig = pf2.value.vbt.lineplot(fig=fig)
fig.show()

```

The same works to plot multiple columns of a portfolio or other complex object. When plotting a graph with subplots, there's an option to overlay each column automatically.

```
pf.plot(per_column=True).show()  

fig = pf["BTC-USD"].plot(show_legend=False, show_column_label=True)
fig = pf["ETH-USD"].plot(show_legend=False, show_column_label=True, fig=fig)
fig.show()  

```

The default theme can be changed globally in the settings. Available themes are registered under `themes` in [settings.plotting](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.plotting).

Set the dark theme

```
vbt.settings.set_theme("dark")

```

Trace parameters such as line color and marker shape can be changed with `trace_kwargs`. Some plotting methods have multiple of such arguments. For allowed parameters, see the Plotly documentation of the respective trace type, for example [Scatter](https://plotly.com/python-api-reference/generated/plotly.graph_objects.Scatter.html) for lines.

Change the color of the upper and lower line of a Bollinger Bands indicator

```
fig = bbands.plot(
    upper_trace_kwargs=dict(line=dict(color="green")),
    lower_trace_kwargs=dict(line=dict(color="red"))
)

```

Layout parameters can be changed by passing them directly to the plot method as variable keyword arguments.

Make the width and height of the plot variable rather than fixed

```
fig = df.vbt.plot(width=None, height=None)

```

A plot with multiple subplots can be constructed with `vbt.make_subplots()`, which takes [the same arguments](https://plotly.com/python-api-reference/generated/plotly.subplots.make_subplots.html) as Plotly.

Create two subplots - one per row

```
fig = vbt.make_subplots(rows=2, cols=1)

```

Most plotting methods accept the argument `add_trace_kwargs` (see [Figure.add\_trace](https://plotly.com/python-api-reference/generated/plotly.graph_objects.Figure.html#plotly.graph_objects.Figure.add_trace)), which can be used to specify which subplot to plot the traces over.

Plot the first and second DataFrame over the first and second subplot respectively

```
df1.vbt.plot(add_trace_kwargs=dict(row=1, col=1), fig=fig)
df2.vbt.plot(add_trace_kwargs=dict(row=2, col=1), fig=fig)

```

Note

The provided figure `fig` must be created with `vbt.make_subplots()`.

Traces with two different scales but similar time scale can also be plotted next to each other by creating a secondary y-axis.

Plot the first and second DataFrame on the first and second y-axis respectively

```
fig = vbt.make_subplots(specs=[[{"secondary_y": True}]])
df1.vbt.plot(add_trace_kwargs=dict(secondary_y=False), fig=fig)
df2.vbt.plot(add_trace_kwargs=dict(secondary_y=True), fig=fig)

```

The figure can be changed manually after creation. Below, `0` is the index of the trace in the figure.

Retrospectively change the title and the markers of the scatter plot

```
fig = df.vbt.scatterplot()
fig.layout.title.text = "Scatter"
fig.data[0].marker.line.width = 4
fig.data[0].marker.line.color = "black"

```

Note

A plotting method can add multiple traces to the figure.

Settings related to plotting can be defined or changed globally in [settings.plotting](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.plotting).

Change the background of any figure to black

```
vbt.settings["plotting"]["layout"]["paper_bgcolor"] = "rgb(0,0,0)"
vbt.settings["plotting"]["layout"]["plot_bgcolor"] = "rgb(0,0,0)"
vbt.settings["plotting"]["layout"]["template"] = "vbt_dark"

```

Same by registering an own theme

```
import plotly.io as pio
import plotly.graph_objects as go

pio.templates["my_black"] = go.layout.Template(
    layout_paper_bgcolor="rgb(0,0,0)",
    layout_plot_bgcolor="rgb(0,0,0)",
)
vbt.settings["plotting"]["layout"]["template"] = "vbt_dark+my_black"

```

Usually Plotly displays a homogeneous datetime index including time gaps such as non-business hours and weekends. To skip the gaps, we can use the `rangebreaks` property.

Skip non-business hours and weekends

```
fig = df.vbt.plot()
fig.update_xaxes(
    rangebreaks=[
        dict(bounds=['sat', 'mon']),
        dict(bounds=[16, 9.5], pattern='hour'),
        
    ]
)

```

Note

Make sure that your data has the correct timezone to apply the above approach.

Skip all gaps automatically

```
fig = df.vbt.plot()
fig.auto_rangebreaks()  
fig.auto_rangebreaks(freq="D")  

# ______________________________________________________________

vbt.settings.plotting.auto_rangebreaks = True
vbt.settings.plotting.auto_rangebreaks = dict(freq="D")

# ______________________________________________________________

def pre_show_func(fig):
    fig.auto_rangebreaks(freq="D")

vbt.settings.plotting.pre_show_func = pre_show_func  
fig = df.vbt.plot()
fig.show()  

```

Note

The above approach works only on figures produced by VBT methods.

To display a figure on an interactive HTML page, see [Interactive HTML Export](https://plotly.com/python/interactive-html-export/).

Save the figure to an HTML file

```
fig.write_html("fig.html")

```

Save multiple figures to the same HTML file

```
with open("fig.html", "a") as f:
    f.write(fig1.to_html(full_html=False))
    f.write(fig2.to_html(full_html=False))
    f.write(fig3.to_html(full_html=False))

```

To display a figure in a separate browser tab, see [Renderers](https://plotly.com/python/renderers/).

Make browser the default renderer

```
import plotly.io as pio
pio.renderers.default = "browser"

```

If a figure takes too much time to display, maybe the amount of data is the problem? If this is the case, [plotly-resampler](https://github.com/predict-idlab/plotly-resampler) may come to the rescue to resample any (primarily scatter) data on the fly.

Enable plotly-resampler globally

```
vbt.settings.plotting.use_resampler = True

```

Another approach is by selecting a date range of particular interest.

Display one year of data

```
fig = fig.select_range(start="2023", end="2024")

```

## From data[¶](https://vectorbt.pro/pvt_40509f46/cookbook/portfolio/#from-data "Permanent link")

To quickly simulate a portfolio from any OHLC data, either use [Data.run](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.run) or pass the data instance (or just a symbol or `class_name:symbol`) to the simulation method.

Various way to quickly simulate a portfolio from a Data instance

```
pf = data.run("from_holding")  
pf = data.run("from_random_signals", n=10)  

pf = vbt.PF.from_holding(data)  
pf = vbt.PF.from_holding("BTC-USD")  
pf = vbt.PF.from_holding("BinanceData:BTCUSDT")  

```

## From signals[¶](https://vectorbt.pro/pvt_40509f46/cookbook/portfolio/#from-signals "Permanent link")

This simulation method is easy to use but still very powerful as long as your strategy can be expressed as signals, such as buy, sell, short sell, and buy to cover.

Various signal configurations

```
pf = vbt.PF.from_signals(data, ...)  
pf = vbt.PF.from_signals(open=open, high=high, low=low, close=close, ...)  
pf = vbt.PF.from_signals(close, ...)  

pf = vbt.PF.from_signals(data, entries, exits)  
pf = vbt.PF.from_signals(data, entries, exits, direction="shortonly")  
pf = vbt.PF.from_signals(data, entries, exits, direction="both")  
pf = vbt.PF.from_signals(  
    data, 
    long_entries=long_entries, 
    long_exits=long_exits,
    short_entries=short_entries, 
    short_exits=short_exits,
)

```

To specify a different price or other argument for long and short signals, create an empty array and use each signal type as a mask to set the corresponding value.

Manually apply a 1% slippage to the price

```
price = data.symbol_wrapper.fill()
price[entries] = data.close * (1 + 0.01)  
price[exits] = data.close * (1 - 0.01)

```

Use the ask price for buying and the bid price for selling

```
price = (bid_price + ask_price) / 2
price[entries] = ask_price
price[exits] = bid_price

```

To exit a trade after a specific amount of time or number of rows, use the `td_stop` argument. The measurement is done from the opening time of the entry row.

How to close out a position after some time

```
pf = vbt.PF.from_signals(..., td_stop="7 days")  
pf = vbt.PF.from_signals(..., td_stop=pd.Timedelta(days=7))
pf = vbt.PF.from_signals(..., td_stop=td_arr)  

pf = vbt.PF.from_signals(..., td_stop=7, time_delta_format="rows")  
pf = vbt.PF.from_signals(..., td_stop=int_arr, time_delta_format="rows")  

pf = vbt.PF.from_signals(..., td_stop=vbt.Param(["1 day", "7 days"]))  

```

To exit a trade at some specific point of time or number of rows, use the `dt_stop` argument. If you pass a timedelta (like above), the position will be exited at the last bar _before_ the target date. Otherwise, if you pass an exact date or time, the position will be exited _at_ or _after_ it. This behavior can be overridden via the argument config.

How to close out a position at some time

```
import datetime

pf = vbt.PF.from_signals(..., dt_stop="daily")  
pf = vbt.PF.from_signals(..., dt_stop=pd.Timedelta(days=1))
pf = vbt.PF.from_signals(  
    ..., 
    dt_stop="daily", 
    arg_config=dict(dt_stop=dict(last_before=False))
)

pf = vbt.PF.from_signals(..., dt_stop="16:00")  
pf = vbt.PF.from_signals(..., dt_stop=datetime.time(16, 0))
pf = vbt.PF.from_signals(  
    ..., 
    dt_stop="16:00", 
    arg_config=dict(dt_stop=dict(last_before=True))
)

pf = vbt.PF.from_signals(..., dt_stop="2024-01-01")  
pf = vbt.PF.from_signals(..., dt_stop=pd.Timestamp("2024-01-01"))
pf = vbt.PF.from_signals(  
    ..., 
    dt_stop="2024-01-01", 
    arg_config=dict(dt_stop=dict(last_before=True))
)
pf = vbt.PF.from_signals(..., dt_stop=dt_arr)  

pf = vbt.PF.from_signals(..., dt_stop=int_arr, time_delta_format="rows")  

pf = vbt.PF.from_signals(..., dt_stop=vbt.Param(["1 day", "7 days"]))  

```

Note

Don't confuse `td_stop` with `dt_stop` - "td" is an abbreviation for a timedelta while "dt" is an abbreviation for a datetime.

To perform multiple actions per bar, the trick is to split each bar into three sub-bars: opening nanosecond, middle, closing nanosecond. For example, you can execute your signals at the end of the bar and your stop orders will guarantee to be executed at the first two sub-bars, so you can close out your position and enter a new one at the same bar.

Execute entries at open, exits at close

```
x3_open = open.vbt.repeat(3, axis=0)  
x3_high = high.vbt.repeat(3, axis=0)
x3_low = low.vbt.repeat(3, axis=0)
x3_close = close.vbt.repeat(3, axis=0)
x3_entries = entries.vbt.repeat(3, axis=0)
x3_exits = exits.vbt.repeat(3, axis=0)

bar_open = slice(0, None, 3)  
bar_middle = slice(1, None, 3)
bar_close = slice(2, None, 3)

x3_high.iloc[bar_open] = open.copy()  
x3_low.iloc[bar_open] = open.copy()
x3_close.iloc[bar_open] = open.copy()

x3_open.iloc[bar_close] = close.copy()  
x3_high.iloc[bar_close] = close.copy()
x3_low.iloc[bar_close] = close.copy()

x3_entries.iloc[bar_middle] = False  
x3_entries.iloc[bar_close] = False

x3_exits.iloc[bar_open] = False  
x3_exits.iloc[bar_middle] = False

x3_index = pd.Series(x3_close.index)  
x3_index.iloc[bar_middle] += pd.Timedelta(nanoseconds=1)
x3_index.iloc[bar_close] += index.freq - pd.Timedelta(nanoseconds=1)
x3_index = pd.Index(x3_index)
x3_open.index = x3_index
x3_high.index = x3_index
x3_low.index = x3_index
x3_close.index = x3_index
x3_entries.index = x3_index
x3_exits.index = x3_index

x3_pf = vbt.PF.from_signals(  
    open=x3_open,
    high=x3_high,
    low=x3_low,
    close=x3_close,
    entries=x3_entries,
    exits=x3_exits,
)
pf = x3_pf.resample(close.index, freq=False, silence_warnings=True)  

```

### Callbacks[¶](https://vectorbt.pro/pvt_40509f46/cookbook/portfolio/#callbacks "Permanent link")

To save an information piece at one timestamp and re-use at a later timestamp in a callback, create a NumPy array and pass it to the callback. The array should be one-dimensional and have the same number of elements as there are columns. The element under the current column can then be read and written using the same mechanism as accessing the latest position via `c.last_position[c.col]`. More information pieces would require either more arrays or one structured array. Multiple arrays can be put into a named tuple for convenience.

Execute only the first signal

```
from collections import namedtuple

Memory = namedtuple("Memory", ["signal_executed"])

@njit
def signal_func_nb(c, entries, exits, memory):
    is_entry = vbt.pf_nb.select_nb(c, entries)
    is_exit = vbt.pf_nb.select_nb(c, exits)
    if is_entry and not memory.signal_executed[c.col]:  
        memory.signal_executed[c.col] = True  
        return True, False, False, False
    if is_exit:
        return False, True, False, False
    return False, False, False, False

def init_memory(target_shape):
    return Memory(
        signal_executed=np.full(target_shape[1], False)  
    )

pf = vbt.PF.from_signals(
    ...,
    entries=entries,
    exits=exits,
    signal_func_nb=signal_func_nb,
    signal_args=(
        vbt.Rep("entries"), 
        vbt.Rep("exits"), 
        vbt.RepFunc(init_memory)
    )
)

```

To overcome the restriction of having only one active built-in limit order at a time, you can create custom limit orders, allowing you to have multiple active orders simultaneously. This can be achieved by storing relevant data in memory and manually checking if the limit order price has been reached each bar. When the price is hit, simply generate a signal.

Breakout strategy by straddling current price with opposing limit orders

```
Memory = namedtuple("Memory", ["signal_price"])  

@njit
def signal_func_nb(c, signals, memory, limit_delta):
    if np.isnan(memory.signal_price[c.col]):
        signal = vbt.pf_nb.select_nb(c, signals)
        if signal:
            memory.signal_price[c.col] = vbt.pf_nb.select_nb(c, c.close)  
    else:
        above_price = vbt.pf_nb.resolve_limit_price_nb(  
            init_price=memory.signal_price[c.col],
            limit_delta=limit_delta,
            hit_below=False
        )
        if vbt.pf_nb.check_price_hit_nb(  
            open=vbt.pf_nb.select_nb(c, c.open),
            high=vbt.pf_nb.select_nb(c, c.high),
            low=vbt.pf_nb.select_nb(c, c.low),
            close=vbt.pf_nb.select_nb(c, c.close),
            price=above_price,
            hit_below=False
        )[2]:
            memory.signal_price[c.col] = np.nan
            return True, False, False, False  
        below_price = vbt.pf_nb.resolve_limit_price_nb(  
            init_price=memory.signal_price[c.col],
            limit_delta=limit_delta,
            hit_below=True
        )
        if vbt.pf_nb.check_price_hit_nb(
            open=vbt.pf_nb.select_nb(c, c.open),
            high=vbt.pf_nb.select_nb(c, c.high),
            low=vbt.pf_nb.select_nb(c, c.low),
            close=vbt.pf_nb.select_nb(c, c.close),
            price=below_price,
            hit_below=True
        )[2]:
            memory.signal_price[c.col] = np.nan
            return False, False, True, False

    return False, False, False, False

def init_memory(target_shape):
    return Memory(
        signal_price=np.full(target_shape[1], np.nan)
    )

pf = vbt.PF.from_signals(
    ...,
    signal_func_nb=signal_func_nb,
    signal_args=(
        vbt.Rep("signals"), 
        vbt.RepFunc(init_memory),
        0.1
    ),
    broadcast_named_args=dict(
        signals=signals
    )
)

```

If signals are generated dynamically and only a subset of the signals are actually executed, you may want to keep track of all the generated signals for later analysis. For this, use function templates to create **global** custom arrays and fill those arrays during the simulation.

Place entries and exits randomly and access them outside the simulation

```
custom_arrays = dict()

def create_entries_out(wrapper):  
    entries_out = np.full(wrapper.shape_2d, False)
    custom_arrays["entries"] = entries_out  
    return entries_out

def create_exits_out(wrapper):
    exits_out = np.full(wrapper.shape_2d, False)
    custom_arrays["exits"] = exits_out
    return exits_out

@njit
def signal_func_nb(c, entry_prob, exit_prob, entries_out, exits_out):
    entry_prob_now = vbt.pf_nb.select_nb(c, entry_prob)
    exit_prob_now = vbt.pf_nb.select_nb(c, exit_prob)
    if np.random.uniform(0, 1) < entry_prob_now:
        is_entry = True
        entries_out[c.i, c.col] = True  
    else:
        is_entry = False
    if np.random.uniform(0, 1) < exit_prob_now:
        is_exit = True
        exits_out[c.i, c.col] = True
    else:
        is_exit = False
    return is_entry, is_exit, False, False

pf = vbt.PF.from_signals(
    ...,
    signal_func_nb=signal_func_nb,
    signal_args=(
        vbt.Rep("entry_prob"), 
        vbt.Rep("exit_prob"), 
        vbt.RepFunc(create_entries_out),  
        vbt.RepFunc(create_exits_out),
    ),
    broadcast_named_args=dict(
        entry_prob=0.1,
        exit_prob=0.1
    )
)

print(custom_arrays)

```

To limit the number of active positions within a group, in a custom signal function, disable any entry signal whenever the number has been reached. The exit signal should be allowed to be executed at any time.

Allow at most one active position at a time

```
@njit
def signal_func_nb(c, entries, exits, max_active_positions):
    is_entry = vbt.pf_nb.select_nb(c, entries)
    is_exit = vbt.pf_nb.select_nb(c, exits)
    n_active_positions = vbt.pf_nb.get_n_active_positions_nb(c)
    if n_active_positions >= max_active_positions:
        return False, is_exit, False, False  
    return is_entry, is_exit, False, False

pf = vbt.PF.from_signals(
    ...,
    entries=entries,
    exits=exits,
    signal_func_nb=signal_func_nb,
    signal_args=(vbt.Rep("entries"), vbt.Rep("exits"), 1),
    group_by=True  
)

```

To access information on the current or previous position, query the position information records.

Ignore entries for a number of days after a losing trade

```
@njit
def signal_func_nb(c, entries, exits, cooldown):
    entry = vbt.pf_nb.select_nb(c, entries)
    exit = vbt.pf_nb.select_nb(c, exits)
    if not vbt.pf_nb.in_position_nb(c):
        if vbt.pf_nb.has_orders_nb(c):
            if c.last_pos_info[c.col]["pnl"] < 0:  
                last_exit_idx = c.last_pos_info[c.col]["exit_idx"]
                if c.index[c.i] - c.index[last_exit_idx] < cooldown:
                    return False, exit, False, False
    return entry, exit, False, False

pf = vbt.PF.from_signals(
    ...,
    signal_func_nb=signal_func_nb,
    signal_args=(
        vbt.Rep("entries"), 
        vbt.Rep("exits"), 
        vbt.dt.to_ns(vbt.timedelta("7D"))
    )
)

```

To activate SL or other stop order after a certain condition, set it initially to infinity and then change the stop value in a callback once the condition is met.

Activate an SL order once a condition is met

```
@njit
def adjust_func_nb(c):
    ...
    if condition_met:
        sl_info = c.last_sl_info[c.col]
        if np.isinf(sl_info.stop):
            sl_info.stop = 0.1

pf = vbt.PF.from_signals(
    ...,
    sl_stop=np.inf,
    stop_entry_price="fillprice",
    adjust_func_nb=adjust_func_nb
)

```

ATR-based TSL order

```
@njit
def adjust_func_nb(c, atr):
    ...
    if c.i > 0:
        tsl_info = c.last_tsl_info[c.col]
        tsl_info["stop"] = vbt.pf_nb.select_nb(c, atr, i=c.i - 1)

pf = vbt.PF.from_signals(
    ...,
    tsl_stop=np.inf,
    stop_entry_price="fillprice",
    delta_format="absolute",
    broadcast_named_args=dict(atr=atr),
    adjust_func_nb=adjust_func_nb,
    adjust_args=(vbt.Rep("atr"),)
)

```

To set a ladder dynamically, use `stop_ladder="dynamic"` and then in a callback use the current ladder step to pull information from a custom array and override the stop information with it.

Set a ladder based on ATR multipliers

```
@njit
def adjust_func_nb(c, atr, multipliers, exit_sizes):
    tp_info = c.last_tp_info[c.col]
    if vbt.pf_nb.is_stop_info_ladder_active_nb(tp_info):
        if np.isnan(tp_info["stop"]):
            step = tp_info["step"]
            init_atr = vbt.pf_nb.select_nb(c, atr, i=tp_info["init_idx"])
            tp_info["stop"] = init_atr * multipliers[step]
            tp_info["delta_format"] = vbt.pf_enums.DeltaFormat.Absolute
            tp_info["exit_size"] = exit_sizes[step]
            tp_info["exit_size_type"] = vbt.pf_enums.SizeType.Percent

pf = vbt.PF.from_signals(
    ...,
    adjust_func_nb=adjust_func_nb,
    adjust_args=(
        vbt.Rep("atr"),
        np.array([1, 2]),
        np.array([0.5, 1.0])
    ),
    stop_ladder="dynamic",
    broadcast_named_args=dict(atr=atr)
)

```

Position metrics such as the current open P&L and return are available via the `last_pos_info` context field, which is an array with one record per column and the data type [trade\_dt](https://vectorbt.pro/pvt_40509f46/api/portfolio/enums/#vectorbtpro.portfolio.enums.trade_dt).

By hitting an unrealized profit of 100%, lock in 50% of it with SL

```
@njit
def adjust_func_nb(c, x, y):  
    pos_info = c.last_pos_info[c.col]
    if pos_info["status"] == vbt.pf_enums.TradeStatus.Open:
        if pos_info["return"] >= x:
            sl_info = c.last_sl_info[c.col]
            if not vbt.pf_nb.is_stop_info_active_nb(sl_info):
                entry_price = pos_info["entry_price"]
                if vbt.pf_nb.in_long_position_nb(c):
                    x_price = entry_price * (1 + x)  
                    y_price = entry_price * (1 + y)  
                else:
                    x_price = entry_price * (1 - x)
                    y_price = entry_price * (1 - y)
                vbt.pf_nb.set_sl_info_nb(
                    sl_info, 
                    init_idx=c.i, 
                    init_price=x_price,
                    stop=y_price,
                    delta_format=vbt.pf_enums.DeltaFormat.Target
                )

pf = vbt.PF.from_signals(
    ..., 
    adjust_func_nb=adjust_func_nb,
    adjust_args=(1.0, 0.5)
)

```

To dynamically determine and apply an optimal position size, create an empty size array full of NaN, and in a callback, compute the target size and write it to the size array.

Risk only 1% of the cash balance with each trade

```
@njit
def adjust_func_nb(c, size, sl_stop, delta_format, risk_amount):
    close_now = vbt.pf_nb.select_nb(c, c.close)
    sl_stop_now = vbt.pf_nb.select_nb(c, sl_stop)
    delta_format_now = vbt.pf_nb.select_nb(c, delta_format)
    risk_amount_now = vbt.pf_nb.select_nb(c, risk_amount)
    free_cash_now = vbt.pf_nb.get_free_cash_nb(c)

    stop_price = vbt.pf_nb.resolve_stop_price_nb(
        init_price=close_now,
        stop=sl_stop_now,
        delta_format=delta_format_now,
        hit_below=True
    )
    price_diff = abs(close_now - stop_price)
    size[c.i, c.col] = risk_amount_now * free_cash_now / price_diff

pf = vbt.PF.from_signals(
    ...,
    adjust_func_nb=adjust_func_nb,
    adjust_args=(
        vbt.Rep("size"), 
        vbt.Rep("sl_stop"), 
        vbt.Rep("delta_format"), 
        vbt.Rep("risk_amount")
    ),
    size=vbt.RepFunc(lambda wrapper: np.full(wrapper.shape_2d, np.nan)),
    sl_stop=0.1,
    delta_format="percent",
    broadcast_named_args=dict(risk_amount=0.01)
)

```

To make SL/TP consider the average entry price instead of the entry price of the first order only when accumulation is enabled, set the initial price of the stop record to the entry price of the position.

Apply an SL of 10% to the accumulated position

```
@njit
def post_signal_func_nb(c):
    if vbt.pf_nb.order_increased_position_nb(c):
        c.last_sl_info[c.col]["init_price"] = c.last_pos_info[c.col]["entry_price"]

pf = vbt.PF.from_signals(
    ...,
    accumulate="addonly",
    sl_stop=0.1,
    post_signal_func_nb=post_signal_func_nb,
)

```

To check at the end of the bar whether a signal has been executed, use `post_signal_func_nb` or `post_segment_func_nb`. The former is called right after an order was executed and can access information on the result of the executed order (`c.order_result`). The latter is called after all the columns in the current group were processed (just one column if there's no grouping), cash deposits and earnings were applied, and the portfolio value and returns were updated.

Apply a 20% tax on any positive P&L generated from closing out a position

```
@njit
def post_signal_func_nb(c, cash_earnings, tax):
    if vbt.pf_nb.order_closed_position_nb(c):
        pos_info = c.last_pos_info[c.col]
        pnl = pos_info["pnl"]
        if pnl > 0:
            cash_earnings[c.i, c.col] = -tax * pnl

tax = 0.2
pf = vbt.PF.from_signals(
    ...,
    post_signal_func_nb=post_signal_func_nb,
    post_signal_args=(vbt.Rep("cash_earnings"), tax),
    cash_earnings=vbt.RepEval("np.full(wrapper.shape_2d, 0.0)")
)

```

Tip

Alternative approach after creating the portfolio:

```
winning_positions = pf.positions.winning
winning_idxs = winning_positions.end_idx.values
winning_pnl = winning_positions.pnl.values
cash_earnings = pf.get_cash_earnings(group_by=False)
if pf.wrapper.ndim == 2:
    winning_cols = winning_positions.col_arr
    cash_earnings.values[winning_idxs, winning_cols] += -tax * winning_pnl
else:
    cash_earnings.values[winning_idxs] += -tax * winning_pnl
new_pf = pf.replace(cash_earnings=cash_earnings)

```

To be able to access the running total return of the simulation, create an empty array for cumulative returns and populate it inside the `post_segment_func_nb` callback. The same array accessed by other callbacks can be used to get the total return at any time step.

Access the running total return from within a simulation

```
@njit
def adjust_func_nb(c, cum_return):
    if c.cash_sharing:
        total_return = cum_return[c.group] - 1
    else:
        total_return = cum_return[c.col] - 1
    ...  

@njit
def post_segment_func_nb(c, cum_return):
    if c.cash_sharing:
        cum_return[c.group] *= 1 + c.last_return[c.group]
    else:
        for col in range(c.from_col, c.to_col):
            cum_return[col] *= 1 + c.last_return[col]

cum_return = None
def init_cum_return(wrapper):
    global cum_return
    if cum_return is None:
        cum_return = np.full(wrapper.shape_2d[1], 1.0)
    return cum_return

pf = vbt.PF.from_signals(
    ...,
    adjust_func_nb=adjust_func_nb,
    adjust_args=(vbt.RepFunc(init_cum_return),),
    post_segment_func_nb=post_segment_func_nb,
    post_segment_args=(vbt.RepFunc(init_cum_return),),
)

```

The same procedure can be applied to access the running trade records of the simulation.

Access the running trade records from within a simulation

```
from collections import namedtuple

TradeMemory = namedtuple("TradeMemory", ["trade_records", "trade_counts"])

@njit
def adjust_func_nb(c, trade_memory):
    trade_count = trade_memory.trade_counts[c.col]
    trade_records = trade_memory.trade_records[:trade_count, c.col]
    ...  

@njit
def post_signal_func_nb(c, trade_memory):
    if vbt.pf_nb.order_filled_nb(c):
        exit_trade_records = vbt.pf_nb.get_exit_trade_records_nb(c)
        trade_memory.trade_records[:len(exit_trade_records), c.col] = exit_trade_records
        trade_memory.trade_counts[c.col] = len(exit_trade_records)

trade_memory = None
def init_trade_memory(target_shape):
    global trade_memory
    if trade_memory is None:
        trade_memory = TradeMemory(
            trade_records=np.empty(target_shape, dtype=vbt.pf_enums.trade_dt),  
            trade_counts=np.full(target_shape[1], 0)
        )
    return trade_memory

pf = vbt.PF.from_random_signals(
    ...,
    post_signal_func_nb=post_signal_func_nb,
    post_signal_args=(vbt.RepFunc(init_trade_memory),),
)

```

To execute SL (or any other order type) at the same bar as entry, we can check whether the stop order can be fulfilled at this bar, and if so, execute it as a regular signal at the next bar.

Execute each entry using open price and potentially SL at the same bar

```
Memory = namedtuple("Memory", ["stop_price", "order_type"])
memory = None

def init_memory(target_shape):
    global memory
    if memory is None:
        memory = Memory(
            stop_price=np.full(target_shape, np.nan),
            order_type=np.full(target_shape, -1),
        )
    return memory

@njit
def signal_func_nb(c, price, memory, ...):
    if c.i > 0 and not np.isnan(memory.stop_price[c.i - 1, c.col]):
        price[c.i, c.col] = memory.stop_price[c.i - 1, c.col]
        return False, True, False, True
    ...


@njit
def post_signal_func_nb(c, memory, ...):
    if vbt.pf_nb.order_opened_position_nb(c):
        open = vbt.pf_nb.select_nb(c, c.open)
        high = vbt.pf_nb.select_nb(c, c.high)
        low = vbt.pf_nb.select_nb(c, c.low)
        close = vbt.pf_nb.select_nb(c, c.close)
        sl_stop_price, _, sl_stop_hit = vbt.pf_nb.check_stop_hit_nb(
            open=open,
            high=high,
            low=low,
            close=close,
            is_position_long=c.last_position[c.col] > 0,
            init_price=c.last_sl_info["init_price"][c.col],
            stop=c.last_sl_info["stop"][c.col],
            delta_format=c.last_sl_info["delta_format"][c.col],
            hit_below=True,
            can_use_ohlc=True,
            check_open=False,
            hard_stop=c.last_sl_info["exit_price"][c.col] == vbt.pf_enums.StopExitPrice.HardStop,
        )
        if sl_stop_hit:
            memory.stop_price[c.i, c.col] = sl_stop_price
            memory.order_type[c.i, c.col] = vbt.sig_enums.StopType.SL
            vbt.pf_nb.clear_sl_info_nb(c.last_sl_info[c.col])
            vbt.pf_nb.clear_tp_info_nb(c.last_tp_info[c.col])

    elif vbt.pf_nb.order_closed_position_nb(c):
        if memory.order_type[c.i - 1, c.col] != -1:
            order = c.order_records[c.order_counts[c.col] - 1, c.col]
            order["stop_type"] = memory.order_type[c.i - 1, c.col]
            order["signal_idx"] = c.i - 1
            order["creation_idx"] = c.i - 1
            order["idx"] = c.i - 1
    ...

pf = vbt.PF.from_signals(
    ...,
    signal_func_nb=signal_func_nb,
    signal_args=(vbt.Rep("price"), vbt.RepFunc(init_memory), ...),
    post_signal_func_nb=post_signal_func_nb,
    post_signal_args=(vbt.RepFunc(init_memory), ...),
    price=vbt.RepFunc(lambda wrapper: np.full(wrapper.shape_2d, -np.inf)),
    sl_stop=0.1,
    stop_entry_price="fillprice"
)

```

## Records[¶](https://vectorbt.pro/pvt_40509f46/cookbook/portfolio/#records "Permanent link")

There are various ways to examine the orders, trades, and positions generated by a simulation. They all represent different concepts in vectorbtpro, make sure to learn their differences by reading the examples listed at the top of the [trades](https://vectorbt.pro/pvt_40509f46/api/portfolio/trades/) module.

Print out information on various records

```
print(pf.orders.readable)  
print(pf.entry_trades.readable)  
print(pf.exit_trades.readable)  
print(pf.trades.readable)  
print(pf.positions.readable)  

print(pf.trade_history)  

```

## Metrics[¶](https://vectorbt.pro/pvt_40509f46/cookbook/portfolio/#metrics "Permanent link")

The default year frequency is 365 days, which also assumes that a trading day spans over 24 hours, but when trading stocks or other securities it must be changed to 252 days or less. Also, you must account for trading hours when dealing with a sub-daily data frequency.

Change the year frequency

```
vbt.settings.returns.year_freq = "auto"  

vbt.settings.returns.year_freq = "252 days"  
vbt.settings.returns.year_freq = pd.Timedelta(days=252)  
vbt.settings.returns.year_freq = pd.offsets.BDay() * 252  
vbt.settings.returns.year_freq = pd.Timedelta(hours=6.5) * 252  

returns_df.vbt.returns(year_freq="252 days").stats()  
pf = vbt.PF.from_signals(..., year_freq="252 days")  

```

Info

The year frequency will be divided by the frequency of your data to get the annualization factor. For example, `pd.Timedelta(hours=6.5) * 252` divided by `15 minutes` will yield a factor of 6552.

To instruct VBT to put zero instead of infinity and NaN in any generated returns, create a [configuration](https://vectorbt.pro/pvt_40509f46/cookbook/configuration/#settings) file (such as `vbt.config`) with the following content:

```
[returns]
inf_to_nan = True
nan_to_zero = True

```

Note

If there is no change, run `vbt.clear_pycache()` and restart the kernel.

To compute a metric based on the returns or other time series of each trade rather than the entire equity, use projections to extract the time series range that corresponds to the trade.

Calculate the average total log return of winning and losing trades

```
winning_trade_returns = pf.trades.winning.get_projections(pf.log_returns, rebase=False)
losing_trade_returns = pf.trades.losing.get_projections(pf.log_returns, rebase=False)
avg_winning_trade_return = vbt.pd_acc.returns(winning_trade_returns, log_returns=True).total().mean()
avg_losing_trade_return = vbt.pd_acc.returns(losing_trade_returns, log_returns=True).total().mean()

```

To compute a trade metric in pure Numba: convert order records into trade records, calculate the column map for the trade records, and then reduce each column into a single number.

Calculate trade win rate in Numba

```
order_records = sim_out.order_records  

order_col_map = vbt.rec_nb.col_map_nb(
    order_records["col"],
    close.shape[1]  
)
trade_records = vbt.pf_nb.get_exit_trades_nb(
    order_records, 
    close, 
    order_col_map
)
trade_col_map = vbt.rec_nb.col_map_nb(
    trade_records["col"], 
    close.shape[1]
)
win_rate = vbt.rec_nb.reduce_mapped_nb(
    trade_records["pnl"], 
    trade_col_map, 
    np.nan, 
    vbt.pf_nb.win_rate_reduce_nb
)

```

Same goes for drawdown records, which are based on cumulative returns.

Calculate maximum drawdown duration in Numba

```
returns = sim_out.in_outputs.returns

cumulative_returns = vbt.ret_nb.cumulative_returns_nb(returns)  
drawdown_records = vbt.nb.get_drawdowns_nb(None, None, None, cumulative_returns)
dd_duration = vbt.nb.range_duration_nb(  
    drawdown_records["start_idx"], 
    drawdown_records["end_idx"], 
    drawdown_records["status"]
)
dd_col_map = vbt.rec_nb.col_map_nb(
    drawdown_records["col"],
    returns.shape[1]
)
max_dd_duration = vbt.rec_nb.reduce_mapped_nb(  
    dd_duration,
    dd_col_map,
    np.nan,
    vbt.nb.max_reduce_nb
)

```

Return metrics aren't based on records but can be calculated directly from returns.

Calculate various return metrics in Numba

```
returns = sim_out.in_outputs.returns

total_return = vbt.ret_nb.total_return_nb(returns)  
max_dd = vbt.ret_nb.max_drawdown_nb(returns)  
sharpe_ratio = vbt.ret_nb.sharpe_ratio_nb(returns, ann_factor=ann_factor)  

```

The columns and groups of the portfolio can be accessed via its wrapper and grouper respectively.

How to get the columns and groups of a Portfolio instance

```
print(pf.wrapper.columns)  
print(pf.wrapper.grouper.is_grouped())  
print(pf.wrapper.grouper.grouped_index)  
print(pf.wrapper.get_columns())  

columns_or_groups = pf.wrapper.get_columns()
first_pf = pf[columns_or_groups[0]]  

```

## Stacking[¶](https://vectorbt.pro/pvt_40509f46/cookbook/portfolio/#stacking "Permanent link")

Multiple compatible array-based strategies can be put into the same portfolio by stacking their respective arrays along columns.

Simulate and analyze multiple strategies jointly

```
strategy_keys = pd.Index(["strategy1", "strategy2"], name="strategy")
entries = pd.concat((entries1, entries2), axis=1, keys=strategy_keys)
exits = pd.concat((exits1, exits2), axis=1, keys=strategy_keys)
pf = vbt.PF.from_signals(data, entries, exits)

```

Multiple incompatible strategies such as those that require different simulation methods or argument combinations can be simulated independently and then stacked for joint analysis. This will combine their data, order records, initial states, in-output arrays, and more, as if they were stacked prior to the simulation with grouping disabled.

Simulate multiple strategies separately but analyze them jointly

```
strategy_keys = pd.Index(["strategy1", "strategy2"], name="strategy")
pf1 = vbt.PF.from_signals(data, entries, exits)
pf2 = vbt.PF.from_orders(data, size, price)
pf = vbt.PF.column_stack((pf1, pf2), wrapper_kwargs=dict(keys=strategy_keys))

# ______________________________________________________________

pf = vbt.PF.column_stack(
    (pf1, pf2), 
    wrapper_kwargs=dict(keys=strategy_keys), 
    group_by=strategy_keys.name  
)

```

## Cleaning[¶](https://vectorbt.pro/pvt_40509f46/cookbook/signals/#cleaning "Permanent link")

Only two arrays can be cleaned at a time, for more arrays write a custom Numba function that does the job.

Clean 4 arrays

```
@njit
def custom_clean_nb(long_en, long_ex, short_en, short_ex):
    new_long_en = np.full_like(long_en, False)
    new_long_ex = np.full_like(long_ex, False)
    new_short_en = np.full_like(short_en, False)
    new_short_ex = np.full_like(short_ex, False)

    for col in range(long_en.shape[1]):  
        position = 0  
        for i in range(long_en.shape[0]):  
            if long_en[i, col] and position != 1:
                new_long_en[i, col] = True  
                position = 1
            elif short_en[i, col] and position != -1:
                new_short_en[i, col] = True
                position = -1
            elif long_ex[i, col] and position == 1:
                new_long_ex[i, col] = True
                position = 0
            elif short_ex[i, col] and position == -1:
                new_short_ex[i, col] = True
                position = 0

    return new_long_en, new_long_ex, new_short_en, new_short_ex

```

Tip

Convert each input array to NumPy with `arr = vbt.to_2d_array(df)` and then each output array back to Pandas with `new_df = df.vbt.wrapper.wrap(arr)`.


