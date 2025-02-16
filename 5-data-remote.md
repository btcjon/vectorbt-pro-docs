Data classes that subclass [RemoteData](https://vectorbt.pro/pvt_40509f46/api/data/custom/remote/#vectorbtpro.data.custom.remote.RemoteData) specialize in pulling (mostly OHLCV) data from remote data sources. In contrast to the classes for locally stored data, they communicate with remote API endpoints and are subject to authentication, authorization, throttling, and other mechanisms that must be taken into account. Also, the amount of data to be fetched is usually not known in advance, and because most data providers have API rate limits and can return only a limited amount of data for each incoming request, there is often a need to iterate over smaller bunches of data and properly concatenate them. Fortunately, vectorbt implements a number of preset data classes that can do all the jobs above automatically.

## Arguments[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#arguments "Permanent link")

Most remote data classes have the following arguments in common:

To get the list of arguments accepted by the fetcher of a remote data class, we can look into the API reference, use the Python's `help` command, or the vectorbt's own helper function [phelp](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.phelp) on the class method [Data.fetch\_symbol](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.fetch_symbol), which creates a query for just one symbol and returns a Series/DataFrame:

```
>>> from vectorbtpro import *

>>> vbt.phelp(vbt.CCXTData.fetch_symbol)
CCXTData.fetch_symbol(
    symbol,
    exchange=None,
    exchange_config=None,
    start=None,
    end=None,
    timeframe=None,
    tz=None,
    find_earliest_date=None,
    limit=None,
    delay=None,
    retries=None,
    fetch_params=None,
    show_progress=None,
    pbar_kwargs=None,
    silence_warnings=None,
    return_fetch_method=False
):
    Override `vectorbtpro.data.base.Data.fetch_symbol` to fetch a symbol from CCXT.

    Args:
        symbol (str): Symbol.

            Symbol can be in the `EXCHANGE:SYMBOL` format, in this case `exchange` argument will be ignored.
        exchange (str or object): Exchange identifier or an exchange object.

            See `CCXTData.resolve_exchange`.
        exchange_config (dict): Exchange config.

            See `CCXTData.resolve_exchange`.
        start (any): Start datetime.

            See `vectorbtpro.utils.datetime_.to_tzaware_datetime`.
        end (any): End datetime.

            See `vectorbtpro.utils.datetime_.to_tzaware_datetime`.
        timeframe (str): Timeframe.

            Allows human-readable strings such as "15 minutes".
        tz (any): Timezone.

            See `vectorbtpro.utils.datetime_.to_timezone`.
        find_earliest_date (bool): Whether to find the earliest date using `CCXTData.find_earliest_date`.
        limit (int): The maximum number of returned items.
        delay (float): Time to sleep after each request (in milliseconds).

            !!! note
                Use only if `enableRateLimit` is not set.
        retries (int): The number of retries on failure to fetch data.
        fetch_params (dict): Exchange-specific keyword arguments passed to `fetch_ohlcv`.
        show_progress (bool): Whether to show the progress bar.
        pbar_kwargs (dict): Keyword arguments passed to `vectorbtpro.utils.pbar.ProgressBar`.
        silence_warnings (bool): Whether to silence all warnings.
        return_fetch_method (bool): Required by `CCXTData.find_earliest_date`.

    For defaults, see `custom.ccxt` in `vectorbtpro._settings.data`.
    Global settings can be provided per exchange id using the `exchanges` dictionary.

```

As we can see, the class [CCXTData](https://vectorbt.pro/pvt_40509f46/api/data/custom/ccxt/#vectorbtpro.data.custom.ccxt.CCXTData) takes the exchange object, the timeframe, the start date, the end date, and other keyword arguments.

### Settings[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#settings "Permanent link")

But why are all argument values `None`? Remember that `None` has a special meaning and instructs vectorbt to pull the argument's default value from the [global settings](https://vectorbt.pro/pvt_40509f46/api/_settings/). Particularly, we should look into the settings defined for CCXT, which are located in the dictionary under `custom.ccxt` in [settings.data](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.data):

```
>>> vbt.pprint(vbt.settings.data["custom"]["ccxt"])
Config(
    exchange='binance',
    exchange_config=dict(
        enableRateLimit=True
    ),
    start=None,
    end=None,
    timeframe='1d',
    tz='UTC',
    find_earliest_date=False,
    limit=1000,
    delay=None,
    retries=3,
    show_progress=True,
    pbar_kwargs=dict(),
    fetch_params=dict(),
    exchanges=dict(),
    silence_warnings=False
)

```

Another way to get the settings is by using the method [Data.get\_settings](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.get_settings):

```
>>> vbt.pprint(vbt.CCXTData.get_settings(path_id="custom"))

```

Hint

Data classes register two path ids: `base` and `custom`. The id `base` manipulates the settings for the base class [Data](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data), while the id `custom` manipulates the settings for any subclass of the class [CustomData](https://vectorbt.pro/pvt_40509f46/api/data/custom/custom/#vectorbtpro.data.custom.custom.CustomData).

Using the default arguments will pull the symbol's entire daily history from Binance.

To set any default, we can change the config directly. Let's change the exchange to BitMEX:

```
>>> vbt.settings.data["custom"]["ccxt"]["exchange"] = "bitmex"

```

Even simpler: similarly to how we used the method [Data.get\_settings](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.get_settings) to get the settings dictionary, let's use the method [Data.set\_settings](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.set_settings) to set them:

```
>>> vbt.CCXTData.set_settings(path_id="custom", exchange="bitmex")
>>> vbt.settings.data["custom"]["ccxt"]["exchange"]
'bitmex'

```

Note

Overriding keys in the dictionary returned by [Data.get\_settings](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.get_settings) will have no effect.

What if we messed up? No need to panic! We can reset the settings at any time:

```
>>> vbt.CCXTData.reset_settings(path_id="custom")
>>> vbt.settings.data["custom"]["ccxt"]["exchange"]
'binance'

```

Hint

This won't reset all settings in vectorbt, only those corresponding to this particular class.

### Start and end[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#start-and-end "Permanent link")

Specifying dates and times is usually very easy thanks to the built-in datetime parser [to\_tzaware\_datetime](https://vectorbt.pro/pvt_40509f46/api/utils/datetime_/#vectorbtpro.utils.datetime_.to_tzaware_datetime), which can parse dates and times from various objects, including human-readable strings, such as `1 day ago`:

```
>>> vbt.local_datetime("1 day ago")
datetime.datetime(2023, 8, 28, 20, 57, 49, 77715, tzinfo=tzlocal())

```

Let's illustrate this by fetching the last 10 minutes of the symbols `BTC/USDT` and `ETH/USDT`:

```
>>> ccxt_data = vbt.CCXTData.pull(
...     ["BTC/USDT", "ETH/USDT"],
...     start="10 minutes ago UTC", 
...     end="now UTC", 
...     timeframe="1m"
... )

```

Note

Different remote data classes may have different symbol notations, such as `BTC/USDT` in CCXT, `BTC-USD` in Yahoo Finance, `BTCUSDT` in Binance, `X:BTCUSD` in Polygon.io, etc.

```
>>> ccxt_data.close
symbol                     BTC/USDT  ETH/USDT
Open time                                    
2023-08-29 18:50:00+00:00  27990.00   1738.22
2023-08-29 18:51:00+00:00  27973.54   1737.43
2023-08-29 18:52:00+00:00  27981.32   1737.53
2023-08-29 18:53:00+00:00  27964.75   1736.64
2023-08-29 18:54:00+00:00  27972.27   1737.15
2023-08-29 18:55:00+00:00  27963.03   1737.10
2023-08-29 18:56:00+00:00  27962.01   1736.70
2023-08-29 18:57:00+00:00  27970.29   1736.82
2023-08-29 18:58:00+00:00  27986.34   1737.00
2023-08-29 18:59:00+00:00  27987.54   1736.80

```

Hint

Dates and times are resolved in [Data.fetch\_symbol](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.fetch_symbol). Whenever fetching high-frequency data, make sure to provide an already resolved start and end time using [to\_tzaware\_datetime](https://vectorbt.pro/pvt_40509f46/api/utils/datetime_/#vectorbtpro.utils.datetime_.to_tzaware_datetime), otherwise, by the time the first symbol has been fetched, the resolved times for the next symbol may have already been changed.

### Timeframe[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#timeframe "Permanent link")

The timeframe format has been standardized across the entire vectorbt codebase, including the preset data classes. This is done by the function [split\_freq\_str](https://vectorbt.pro/pvt_40509f46/api/utils/datetime_/#vectorbtpro.utils.datetime_.split_freq_str), which splits a timeframe string into a multiplier and a unit:

```
>>> vbt.dt.split_freq_str("15 minutes")
(15, 'm')

>>> vbt.dt.split_freq_str("daily")
(1, 'D')

>>> vbt.dt.split_freq_str("1wk")
(1, 'W')

>>> vbt.dt.split_freq_str("annually")
(1, 'Y')

```

After the split, each preset data class transforms the resulting multiplier and the unit into the format acceptable by its API. For example, in the class [PolygonData](https://vectorbt.pro/pvt_40509f46/api/data/custom/polygon/#vectorbtpro.data.custom.polygon.PolygonData), the unit `"m"` is translated into `"minute"`, while in the class [AlpacaData](https://vectorbt.pro/pvt_40509f46/api/data/custom/alpaca/#vectorbtpro.data.custom.alpaca.AlpacaData) it's translated into `TimeFrameUnit.Minute`. Note, however, that the units such as `"m"` are for internal purposes only and shouldn't be directly used in Pandas. For example, using `"m"` to construct a date offset (for the use in [pandas.DataFrame.resample](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.resample.html)) yields a month end, while using it to construct a timedelta yields a minute:

```
>>> from pandas.tseries.frequencies import to_offset

>>> to_offset("1m")
<MonthEnd>

>>> pd.Timedelta("1m")
Timedelta('0 days 00:01:00')

```

Here, we should use [to\_offset](https://vectorbt.pro/pvt_40509f46/api/utils/datetime_/#vectorbtpro.utils.datetime_.to_offset) and [to\_timedelta](https://vectorbt.pro/pvt_40509f46/api/utils/datetime_/#vectorbtpro.utils.datetime_.to_timedelta) respectively, which are in-house functions capable of classifying many conventional formats:

```
>>> vbt.offset("1m")
<Minute>

>>> vbt.timedelta("1m")
Timedelta('0 days 00:01:00')

```

Let's pull the 30-minute `BTC/USDT` data of the current day:

```
>>> ccxt_data = vbt.CCXTData.pull(
...     "BTC/USDT",
...     start="today midnight UTC", 
...     timeframe="30 minutes"
... )
>>> ccxt_data.get()
                               Open      High       Low     Close       Volume
Open time                                                                     
2023-08-29 00:00:00+00:00  26120.00  26135.20  26092.91  26092.91    244.82583
2023-08-29 00:30:00+00:00  26092.92  26165.99  26084.07  26140.44    372.98168
2023-08-29 01:00:00+00:00  26140.44  26206.24  26105.78  26127.64    595.85951
...                             ...       ...       ...       ...          ...
2023-08-29 18:00:00+00:00  27892.08  27973.14  27835.84  27949.82   1217.90593
2023-08-29 18:30:00+00:00  27949.83  28020.73  27910.70  27971.79   1422.90243
2023-08-29 19:00:00+00:00  27971.78  27982.65  27900.87  27910.01    220.80118

```

### Client[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#client "Permanent link")

Many APIs require a client to make a request. Data classes based on such APIs usually have a class method with the name `resolve_client` for resolving the client, which is called before pulling each symbol. If the client hasn't been provided by the user (`None`), this method creates one automatically based on the config `client_config`. Such a config can contain various things: from API keys to connection parameters. For example, let's take a look at the default client of [BinanceData](https://vectorbt.pro/pvt_40509f46/api/data/custom/binance/#vectorbtpro.data.custom.binance.BinanceData):

```
>>> binance_client = vbt.BinanceData.resolve_client()
>>> binance_client
<binance.client.Client at 0x7f893a193af0>

```

To supply information to this client, we can provide keyword arguments directly:

```
>>> binance_client = vbt.BinanceData.resolve_client(
...     api_key="YOUR_KEY",
...     api_secret="YOUR_SECRET"
... )
>>> binance_client
<binance.client.Client at 0x7f89183512e0>

```

Since the client is getting created automatically, we can pass all the client-related information using the argument `client_config` during fetching:

```
>>> binance_data = vbt.BinanceData.pull(
...     "BTCUSDT",
...     client_config=dict(
...         api_key="YOUR_KEY",
...         api_secret="YOUR_SECRET"
...     )
... )
>>> binance_data.get()
                               Open      High       Low     Close  \
Open time                                                           
2017-08-17 00:00:00+00:00   4261.48   4485.39   4200.74   4285.08   
2017-08-18 00:00:00+00:00   4285.08   4371.52   3938.77   4108.37   
2017-08-19 00:00:00+00:00   4108.37   4184.69   3850.00   4139.98   
...                             ...       ...       ...       ...   
2023-08-27 00:00:00+00:00  26017.38  26182.23  25966.11  26101.77   
2023-08-28 00:00:00+00:00  26101.78  26253.99  25864.50  26120.00   
2023-08-29 00:00:00+00:00  26120.00  28142.85  25922.00  27895.97   

                                 Volume  Quote volume  Trade count  \
Open time                                                            
2017-08-17 00:00:00+00:00    795.150377  3.454770e+06         3427   
2017-08-18 00:00:00+00:00   1199.888264  5.086958e+06         5233   
2017-08-19 00:00:00+00:00    381.309763  1.549484e+06         2153   
...                                 ...           ...          ...   
2023-08-27 00:00:00+00:00  12099.642160  3.155484e+08       349090   
2023-08-28 00:00:00+00:00  22692.626550  5.910089e+08       523057   
2023-08-29 00:00:00+00:00  65076.334610  1.768909e+09       968856   

                           Taker base volume  Taker quote volume  
Open time                                                         
2017-08-17 00:00:00+00:00         616.248541        2.678216e+06  
2017-08-18 00:00:00+00:00         972.868710        4.129123e+06  
2017-08-19 00:00:00+00:00         274.336042        1.118002e+06  
...                                      ...                 ...  
2023-08-27 00:00:00+00:00        6170.486640        1.609182e+08  
2023-08-28 00:00:00+00:00       10912.405490        2.842262e+08  
2023-08-29 00:00:00+00:00       33459.465920        9.098352e+08  

[2204 rows x 9 columns]

```

But if you run [BinanceData.resolve\_client](https://vectorbt.pro/pvt_40509f46/api/data/custom/binance/#vectorbtpro.data.custom.binance.BinanceData.resolve_client), you'd know that it takes time to instantiate a client, and we don't want to wait that long for every single symbol we're attempting to fetch. Thus, a better decision would be instantiating a client manually only once and then passing it via the argument `client`, which will reuse the client and make fetching noticeably faster:

```
>>> binance_data = vbt.BinanceData.pull(
...     "BTCUSDT",
...     client=binance_client
... )

```

Info

This will also enable re-using the client or the client config during updating since passing any argument to the fetcher will store it inside the dictionary [Data.fetch\_kwargs](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.fetch_kwargs), which is used by the updater.

Warning

But this also means that sharing the data object with anyone may expose your credentials!

To not compromise the security, the recommended approach is to set any credentials and clients globally, as we discussed previously. This won't store them inside the data instance.

```
>>> vbt.BinanceData.set_settings(
...     path_id="custom",
...     client=binance_client
... )

```

Hint

See the API documentation of the particular data class for examples.

### Saving[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#saving "Permanent link")

To save any remote data instance, see [this documentation](https://vectorbt.pro/pvt_40509f46/documentation/data/local/). In short: pickling is preferred because it also saves all the arguments that were passed to the fetcher, such as the selected timeframe. Those arguments are important when updating - without them, you'd have to provide them manually every time you attempt to update the data.

```
>>> binance_data = vbt.BinanceData.pull(
...     "BTCUSDT",
...     start="today midnight UTC",
...     timeframe="1 hour"
... )
>>> binance_data.save("binance_data")

>>> binance_data = vbt.BinanceData.load("binance_data")
>>> vbt.pprint(binance_data.fetch_kwargs)
symbol_dict(
    BTCUSDT=dict(
        start='today midnight UTC',
        timeframe='1 hour',
        silence_warnings=False
    )
)

```

As we can see, all the arguments were saved along with the data instance. But in a case where we don't plan on updating the data, we can save the arrays themselves across one or multiple CSV files/HDF keys, one per symbol:

```
>>> binance_data.to_csv()  

>>> csv_data = vbt.CSVData.pull("BTCUSDT.csv")

```

But what if we wanted to update the data locally stored in a CSV/HDF file? The fetching-related keyword arguments do not include the timeframe and other parameters anymore, they include only those arguments that are important for the data class holding the data - [CSVData](https://vectorbt.pro/pvt_40509f46/api/data/custom/csv/#vectorbtpro.data.custom.csv.CSVData):

```
>>> vbt.pprint(csv_data.fetch_kwargs)
symbol_dict(
    BTCUSDT=dict(
        path=PosixPath('BTCUSDT.csv')
    )
)

```

If we use the update method on this data instance, it would attempt to update using the local data, not using the remote data. To update from a remote endpoint, we need to switch the data class back to the original class, in this case - [BinanceData](https://vectorbt.pro/pvt_40509f46/api/data/custom/binance/#vectorbtpro.data.custom.binance.BinanceData). For this, we can use the method [Data.switch\_class](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.switch_class), which can additionally clear all the fetching-related and returned keyword arguments that are related to the CSV file:

```
>>> binance_data = csv_data.switch_class(
...     new_cls=vbt.BinanceData, 
...     clear_fetch_kwargs=True,
...     clear_returned_kwargs=True
... )
>>> type(binance_data)
vectorbtpro.data.custom.binance.BinanceData

```

Finally, use the method [Data.update\_fetch\_kwargs](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data.update_fetch_kwargs) to update the fetching-related keyword arguments with the timeframe to avoid repeatedly setting it when updating:

```
>>> binance_data = binance_data.update_fetch_kwargs(timeframe="1 hour")
>>> vbt.pprint(binance_data.fetch_kwargs)
symbol_dict(
    BTCUSDT=dict(
        timeframe='1 hour'
    )
)

```

Is there an easier way? Sure! The class methods [RemoteData.from\_csv](https://vectorbt.pro/pvt_40509f46/api/data/custom/remote/#vectorbtpro.data.custom.remote.RemoteData.from_csv) and [RemoteData.from\_hdf](https://vectorbt.pro/pvt_40509f46/api/data/custom/hdf/#vectorbtpro.data.custom.hdf.RemoteData.from_hdf) are accessible from all data classes and perform all the operations above automatically:

```
>>> binance_data = vbt.BinanceData.from_csv(
...     "BTCUSDT.csv", 
...     fetch_kwargs=dict(timeframe="1 hour")
... )

>>> type(binance_data)
<class 'vectorbtpro.data.custom.binance.BinanceData'>

>>> vbt.pprint(binance_data.fetch_kwargs)
symbol_dict(
    BTCUSDT=dict(
        timeframe='1 hour'
    )
)

```

### Updating[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#updating "Permanent link")

Updating a data instance is generally easy:

```
>>> binance_data = binance_data.update()

```

Note

Updating the current data instance always returns a new data instance.

Under the hood, the updater first overrides the start date with the latest date in the index, and then calls the fetcher. That's why we can specify or override any argument originally used in fetching. Also note that it will only pull new data if the end date is not fixed: if we used the end date `2022-01-01` when fetching, it will be used again when updating, thus make sure to set `end` to `"now"` or `"now UTC"`. Let's first fetch the history for the year 2020, and then append the history for the year 2021:

```
>>> binance_data = vbt.BinanceData.pull(
...     "BTCUSDT", 
...     start="2020-01-01", 
...     end="2021-01-01"
... )
>>> binance_data = binance_data.update(end="2022-01-01")  
>>> binance_data.wrapper.index
DatetimeIndex(['2020-01-01 00:00:00+00:00', '2020-01-02 00:00:00+00:00',
               '2020-01-03 00:00:00+00:00', '2020-01-04 00:00:00+00:00',
               '2020-01-05 00:00:00+00:00', '2020-01-06 00:00:00+00:00',
               ...
               '2021-12-26 00:00:00+00:00', '2021-12-27 00:00:00+00:00',
               '2021-12-28 00:00:00+00:00', '2021-12-29 00:00:00+00:00',
               '2021-12-30 00:00:00+00:00', '2021-12-31 00:00:00+00:00'],
              dtype='datetime64[ns, UTC]', name='Open time', length=731, freq='D')

```

## From URL[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#from-url "Permanent link")

Even though [CSVData](https://vectorbt.pro/pvt_40509f46/api/data/custom/csv/#vectorbtpro.data.custom.csv.CSVData) was designed for the local file system, we can apply a couple of tricks to pull remote data with it as well! Remember how it uses [pandas.read\_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html)? This function has an argument `filepath_or_buffer`, which can be a URL. All we have to do is to disable the path matching mechanism by setting `match_paths` to False.

Here's an example of pulling S&P 500 index data:

```
>>> url = "https://datahub.io/core/s-and-p-500/r/data.csv"
>>> csv_data = vbt.CSVData.pull(url, match_paths=False)
>>> csv_data.get()
                             SP500  Dividend  Earnings  Consumer Price Index  \
Date                                                                           
1871-01-01 00:00:00+00:00     4.44      0.26      0.40                 12.46   
1871-02-01 00:00:00+00:00     4.50      0.26      0.40                 12.84   
1871-03-01 00:00:00+00:00     4.61      0.26      0.40                 13.03   
...                            ...       ...       ...                   ...   
2018-02-01 00:00:00+00:00  2705.16     49.64       NaN                248.99   
2018-03-01 00:00:00+00:00  2702.77     50.00       NaN                249.55   
2018-04-01 00:00:00+00:00  2642.19       NaN       NaN                249.84   

                           Long Interest Rate  Real Price  Real Dividend  \
Date                                                                       
1871-01-01 00:00:00+00:00                5.32       89.00           5.21   
1871-02-01 00:00:00+00:00                5.32       87.53           5.06   
1871-03-01 00:00:00+00:00                5.33       88.36           4.98   
...                                       ...         ...            ...   
2018-02-01 00:00:00+00:00                2.86     2714.34          49.81   
2018-03-01 00:00:00+00:00                2.84     2705.82          50.06   
2018-04-01 00:00:00+00:00                2.80     2642.19            NaN   

                           Real Earnings   PE10  
Date                                             
1871-01-01 00:00:00+00:00           8.02    NaN  
1871-02-01 00:00:00+00:00           7.78    NaN  
1871-03-01 00:00:00+00:00           7.67    NaN  
...                                  ...    ...  
2018-02-01 00:00:00+00:00            NaN  32.12  
2018-03-01 00:00:00+00:00            NaN  31.99  
2018-04-01 00:00:00+00:00            NaN  31.19  

[1768 rows x 9 columns]

```

### AWS S3[¶](https://vectorbt.pro/pvt_40509f46/documentation/data/remote/#aws-s3 "Permanent link")

Here's another example for AWS S3:

```
>>> import boto3
>>> s3_client = boto3.client("s3")  

>>> symbols = ["BTCUSDT", "ETHUSDT"]
>>> paths = vbt.symbol_dict({ 
...     s: s3_client.get_object(
...         Bucket="binance", 
...         Key=f"data/{s}.csv")["Body"]  
...     for s in symbols
... })
>>> s3_data = vbt.CSVData.pull(symbols, paths=paths, match_paths=False)  
>>> s3_data.close
symbol                      BTCUSDT  ETHUSDT
Open time                                   
2017-08-17 00:00:00+00:00   4285.08   302.00
2017-08-18 00:00:00+00:00   4108.37   293.96
2017-08-19 00:00:00+00:00   4139.98   290.91
2017-08-20 00:00:00+00:00   4086.29   299.10
2017-08-21 00:00:00+00:00   4016.00   323.29
...                             ...      ...
2022-02-14 00:00:00+00:00  42535.94  2929.75
2022-02-15 00:00:00+00:00  44544.86  3183.52
2022-02-16 00:00:00+00:00  43873.56  3122.30
2022-02-17 00:00:00+00:00  40515.70  2891.87
2022-02-18 00:00:00+00:00  39892.83  2768.74

[1647 rows x 2 columns]

```

We could have loaded both datasets using [pandas.read\_csv](https://pandas.pydata.org/docs/reference/api/pandas.read_csv.html) itself, but wrapping them with [CSVData](https://vectorbt.pro/pvt_40509f46/api/data/custom/csv/#vectorbtpro.data.custom.csv.CSVData) allows us to take advantage of the vectorbt's powerful [Data](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data) class, for example, to update the remote datasets whenever new data points arrive - a true ![💎](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f48e.svg ":gem:")

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/documentation/data/remote.py.txt)