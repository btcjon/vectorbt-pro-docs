In what follows, we will look at sub-packages, modules, and especially classes that act as building blocks for more advanced functionalities distributed across vectorbt, such as [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio). For illustration, we will gradually build our custom class `CorrStats` that will let us analyze the correlation between two arrays in the most performant and flexible way ![🧠](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f9e0.svg ":brain:")

## Utilities[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#utilities "Permanent link")

(Reload the page if the diagram doesn't show up)

graph TD;
    Configured -->|references| Config;
    Configured -->|inherits| Config;
    AttrResolverMixin -->|inherits| Config;
    Config -->|inherits| Pickleable;
    Config -->|inherits| Prettified;
    Config -->|inherits| Configured;
    Config -->|inherits| AttrResolverMixin;
    
    style Configured stroke:#635bff,stroke-width:2px;
    style AttrResolverMixin stroke:#635bff,stroke-width:2px;
    style Config stroke:#635bff,stroke-width:2px;
    style Pickleable stroke:#635bff,stroke-width:2px;
    style Prettified stroke:#635bff,stroke-width:2px;


VectorBT PRO deploys a modular project structure that is composed of a range of subpackages. Each subpackage is applicable to a certain area of analysis.

Subpackage [utils](https://vectorbt.pro/pvt_40509f46/api/utils/) contains a set of utilities powering every part of vectorbt ![⚡](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/26a1.svg ":zap:") They are loosely connected and provide small but powerful re-usable code snippets that can be used independently of other functionality.

Info

The main reason why we don't import third-party packages but implement many utilities from scratch is because we want to retain full control over execution and code quality.

### Formatting[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#formatting "Permanent link")

VectorBT PRO implements its own formatting engine that can pretty-print any Python object. It's far more superior to formatting with [JSON](https://en.wikipedia.org/wiki/JSON) because it respects native Python data types and injects some smart formatting logic when it comes to more structured data types, such as `np.dtype` and `namedtuple`. Often, we can even convert the string back into Python using `eval`.

Let's beautify a nested dictionary using [prettify](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.prettify) and convert the string back into an object:

```
>>> from vectorbtpro import *

>>> dct = {'planet' : {'has': {'plants': 'yes', 'animals': 'yes', 'cryptonite': 'no'}, 'name': 'Earth'}}
>>> print(vbt.prettify(dct))
{
    'planet': {
        'has': {
            'plants': 'yes',
            'animals': 'yes',
            'cryptonite': 'no'
        },
        'name': 'Earth'
    }
}

>>> eval(vbt.prettify(dct)) == dct
True

```

Hint

Wondering why we used `vbt.prettify` instead of `vbt.utils.formatting.prettify`? Any utility that may prove useful to the end user can be accessed directly from `vbt`.

To see which utilities are accessible from the root of the package, visit [vectorbtpro/utils/\_\_init\_\_.py](https://github.com/polakowo/vectorbt.pro/blob/main/vectorbtpro/utils/__init__.py) or any other subpackage, and look for the objects that are listed in `__all__`.

Class [Prettified](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.formatting.Prettified) implements the abstract method [Prettified.prettify](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.Prettified.prettify), which a subclass can override to pretty-print an instance using [prettify](https://vectorbt.pro/pvt_40509f46/api/utils/formatting/#vectorbtpro.utils.formatting.prettify). Read below to learn how instances of various classes can be introspected using this method.

### Pickling[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#pickling "Permanent link")

Pickling is the process of converting a Python object into a byte stream to store it in a file/database. Class [Pickleable](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.Pickleable) enables pickling of objects of any complexity using [Dill](https://dill.readthedocs.io/en/latest/) (or [pickle](https://docs.python.org/3/library/pickle.html) if Dill is not installed). Each of its subclasses inherits ready-to-use methods for serializing, de-serializing, saving to a file, and loading from a file. This is truly amazing because it allows us to persist objects holding any type of data, including instances of [Data](https://vectorbt.pro/pvt_40509f46/api/data/base/#vectorbtpro.data.base.Data) and [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio).

### Configuring[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#configuring "Permanent link")

VectorBT PRO heavily relies upon automation based on some sort of specification. The specification for most repetitive tasks is usually stored inside so-called "configs", which act as settings for a certain task, a data structure, or even a class. This makes most places in vectorbt transparent and easily traversable and changeable programmatically.

Class [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config) is a dictionary on steroids: it extends the Python's `dict` with various configuration features, such as frozen keys, read-only values, accessing keys via the dot notation, and nested updates. The most notable feature is the ability to reset a config to its initial state and even make checkpoints, which is particularly useful for settings. In addition, since [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config) inherits [Pickleable](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.pickling.Pickleable), we can save any configuration to disk, while subclassing [Prettified](https://vectorbt.pro/pvt_40509f46/api/utils/pickling/#vectorbtpro.utils.formatting.Prettified) allows us to beautify it (by the way, this approach is being used to generate the API reference):

```
>>> print(vbt.Records.field_config)
Config(
    dtype=None,
    settings={
        'id': {
            'name': 'id',
            'title': 'Id'
        },
        'col': {
            'name': 'col',
            'title': 'Column',
            'mapping': 'columns'
        },
        'idx': {
            'name': 'idx',
            'title': 'Timestamp',
            'mapping': 'index'
        }
    }
)

```

Configs are very common structures in vectorbt. There are three main types of configs (that either subclass or partially call [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config)) used throughout vectorbt:

1.  [ReadonlyConfig](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.ReadonlyConfig) for configurations that aren't meant to be modified, such as [nb\_config](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.nb_config), which is being used to attach a number of Numba-compiled functions to [GenericAccessor](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor) only once upon importing vectorbt, so if it were modifiable it wouldn't have any effect anyway.
2.  [HybridConfig](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.HybridConfig) for configuration that are meant to be modified. The best examples are [Portfolio.metrics](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.metrics) and [Portfolio.subplots](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio.subplots), which contain all the metrics and subplots supported by [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio); they can be easily changed and extended, and then reset if you did some breaking changes.
3.  [SettingsConfig](https://vectorbt.pro/pvt_40509f46/api/_settings/#vectorbtpro._settings.SettingsConfig) holding the global settings defined in [\_settings](https://vectorbt.pro/pvt_40509f46/api/_settings/). It's a custom subclass of [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config) that is capable of changing Plotly themes and converting any sub-configs of type `dict` to smaller settings accessible via the dot notation (`vbt.settings.portfolio.log` instead of `vbt.settings['portfolio']['log']`)

A config can be created like a regular `dict`. To provide options for this config, use the `options_` argument (notice the trailing underscore):

```
>>> cfg = vbt.Config(
...     hello="world",
...     options_=dict(readonly=True)
... )
>>> print(cfg)
Config(
    hello='world'
)

>>> cfg["change"] = "something"
TypeError: Config is read-only

```

Apart from the use cases listed above, [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config) is also being used by the class [Configured](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured), which is a base class to most core classes in vectorbt. It's a read-only class that holds a config of type [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config) with all arguments passed during the initialization. Whenever we initialize any subclass of [Configured](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured), any named arguments we passed to the initializer (`__init__`) are stored inside [Configured.config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured.config). This way, the created instance is described and managed solely by its config:

-   We can copy/modify the config and pass it to the class to initialize another instance (`new_instance = ConfiguredClass(**old_instance.config)`)
-   We can pickle the class and the config to pickle the entire instance
-   We can compare instances based on their classes and configs

The main requirement for all of this to work properly is **immutability**. And here we have arrived at the first very important design decision: most classes in vectorbt are meant to be immutable (read-only) and it's discouraged to change any attribute unless it's listed in a special variable called `_writeable_attrs`. There are multiple reasons why we require immutability:

1.  Immutable instances can be easily recreated and manipulated using their configs
2.  Immutable instances are side effect free and can have cached attributes
3.  Immutable instances can be hashed

Let's create our custom class that returns some correlation statistics of two arrays. In particular, it will compute the Pearson correlation coefficient and its rolling version using Pandas:

```
>>> class CorrStats(vbt.Configured):
...     def __init__(self, obj1, obj2):
...         vbt.Configured.__init__(self, obj1=obj1, obj2=obj2)
...
...         self._obj1 = obj1
...         self._obj2 = obj2
...
...     @property
...     def obj1(self):
...         return self._obj1
...
...     @property
...     def obj2(self):
...         return self._obj2
...
...     def corr(self):
...         if isinstance(self.obj1, pd.Series):
...             return self.obj1.corr(self.obj2)
...         return self.obj1.corrwith(self.obj2)
...
...     def rolling_corr(self, window):
...         return self.obj1.rolling(window).corr(self.obj2)

```

This is how most configured classes in vectorbt, such as [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio), are designed. Any argument that is being passed to `CorrStats` is forwarded down to [Configured](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured) to initialize a new config:

```
>>> index = vbt.date_range("2020", periods=5)
>>> df1 = pd.DataFrame({
...     'a': [1, 5, 2, 4, 3],
...     'b': [3, 2, 4, 1, 5]
... }, index=index)
>>> df2 = pd.DataFrame({
...     'a': [1, 2, 3, 4, 5],
...     'b': [5, 4, 3, 2, 1]
... }, index=index)

>>> corrstats = CorrStats(df1, df2)
>>> print(corrstats.config)
Config(
    obj1=<DataFrame object at 0x7fd490461400 of shape (5, 2)>,
    obj2=<DataFrame object at 0x7fd490461240 of shape (5, 2)>
)

```

Access to any attribute is read-only: whenever we try to set a read-only property or modify the config, an (expected) error will be thrown:

```
>>> df3 = pd.DataFrame({
...     'a': [3, 2, 1, 5, 4],
...     'b': [4, 5, 1, 2, 3]
... }, index=index)
>>> corrstats.obj1 = df3
AttributeError: can't set attribute

>>> corrstats.config['obj1'] = df3
TypeError: Config is read-only

```

However, it won't (and can't) throw an error when setting a private attribute (with a leading underscore) or if any of the attributes were modified in place, which is a common pitfall you should avoid.

```
>>> corrstats._obj1 = df3  
>>> corrstats.obj1.iloc[:] = df3  

```

Warning

vectorbt assumes that the data in a configured instance always stays the same. Whenever there is a change to data, vectorbt won't register it and likely deliver erroneous results at some point in time.

The only approved way to change any data in an instance is to create another instance!

To change anything, pass the new data to [Configured.replace](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured.replace), which takes the same arguments as the class but in the keyword-only format, merges them over the old config, and passes as keyword arguments to the class for instantiation.

```
>>> new_corrstats = corrstats.replace(obj1=df3)
>>> new_corrstats.obj1  
            a  b
2020-01-01  3  4
2020-01-02  2  5
2020-01-03  1  1
2020-01-04  5  2
2020-01-05  4  3

>>> new_corrstats.obj2  
            a  b
2020-01-01  1  5
2020-01-02  2  4
2020-01-03  3  3
2020-01-04  4  2
2020-01-05  5  1

```

Since all of our data is now stored inside a config, we can perform many actions on the instance as if we performed them on the config itself, such as saving to disk (thanks to [Pickling](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#pickling)):

```
>>> corrstats.save('corrstats')  

>>> corrstats = CorrStats.load('corrstats')

```

### Attribute resolution[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#attribute-resolution "Permanent link")

Attribute resolution is handy when it comes to accessing attributes based on strings or some other logic, which is realized by the mixin [AttrResolverMixin](https://vectorbt.pro/pvt_40509f46/api/utils/attr_/#vectorbtpro.utils.attr_.AttrResolverMixin). You can imagine it implementing an arbitrary logic for a custom `getattr` operation. It's widely used in [StatsBuilderMixin](https://vectorbt.pro/pvt_40509f46/api/generic/stats_builder/#vectorbtpro.generic.stats_builder.StatsBuilderMixin) and [PlotsBuilderMixin](https://vectorbt.pro/pvt_40509f46/api/generic/plots_builder/#vectorbtpro.generic.plots_builder.PlotsBuilderMixin) to execute metrics and subplots respectively as a chain of commands. In other classes, such as [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio), it's also being used for accessing shortcut properties, caching attribute access, and more. It works in conjunction with [deep\_getattr](https://vectorbt.pro/pvt_40509f46/api/utils/attr_/#vectorbtpro.utils.attr_.deep_getattr), which accesses a chain of attributes provided as a specification.

Let's compute the min of the rolling mean solely using Pandas and deep attribute resolution:

```
>>> sr = pd.Series([1, 2, 3, 4, 5])
>>> attr_chain = [('rolling', (3,)), 'mean', 'min']
>>> vbt.deep_getattr(sr, attr_chain)
2.0

```

If any of the above operations were done on a subclass [AttrResolverMixin](https://vectorbt.pro/pvt_40509f46/api/utils/attr_/#vectorbtpro.utils.attr_.AttrResolverMixin), they could have been preprocessed and postprocessed easily.

### Templating[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#templating "Permanent link")

Templates play an important role in the vectorbt's ecosystem. They allow postponing data resolution to a later point in time when there is more information available. There are many different templating classes, such as [Rep](https://vectorbt.pro/pvt_40509f46/api/utils/template/#vectorbtpro.utils.template.Rep) for replacing an entire string and [Sub](https://vectorbt.pro/pvt_40509f46/api/utils/template/#vectorbtpro.utils.template.Sub) for substituting only parts of it (those beginning with `$`).

You can imagine templates being callbacks that are executed at some point during the execution, mostly after broadcasting or merging keyword arguments. Also, there exist functions that offer multiple potential substitution points; in such case, they either attempt to substitute the template multiple times until they succeed, or they match the template with a specific evaluation id (`eval_id`), if provided. The actual evaluation operation is performed by [substitute\_templates](https://vectorbt.pro/pvt_40509f46/api/utils/template/#vectorbtpro.utils.template.substitute_templates).

```
>>> def some_function(*args, **kwargs):
...     context = {}
...     args = vbt.substitute_templates(args, context=context, strict=False)
...     kwargs = vbt.substitute_templates(kwargs, context=context, strict=False)
...     print(args)
...     print(kwargs)
...     
...     context['result'] = 100  
...     args = vbt.substitute_templates(args, context=context)
...     kwargs = vbt.substitute_templates(kwargs, context=context)
...     print(args)
...     print(kwargs)

>>> some_function(vbt.Rep('result'), double_result=vbt.RepEval('result * 2'))
(Rep(template='result', context=None, strict=None, eval_id=None),)
{'double_result': RepEval(template='result * 2', context=None, strict=None, eval_id=None)}
(100,)
{'double_result': 200}

```

## Base[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#base "Permanent link")

graph TD;
    BaseAccessor -->|inherits| Wrapping;
    Wrapping -->|inherits| AttrResolverMixin;
    Wrapping -->|inherits| PandasIndexer;
    Wrapping -.->|references| ArrayWrapper;
    ArrayWrapper -->|inherits| Configured;
    ArrayWrapper -.->|references| Grouper;
    Grouper -->|inherits| Configured;
    PandasIndexer -->|inherits| Configured;

    style BaseAccessor stroke:#635bff,stroke-width:2px;
    style Wrapping stroke:#635bff,stroke-width:2px;
    style AttrResolverMixin stroke:#635bff,stroke-width:2px;
    style ArrayWrapper stroke:#635bff,stroke-width:2px;
    style PandasIndexer stroke:#635bff,stroke-width:2px;
    style Configured stroke:#635bff,stroke-width:2px;
    style Grouper stroke:#635bff,stroke-width:2px;


Subpackage [base](https://vectorbt.pro/pvt_40509f46/api/base/) is the non-computational core of vectorbt. It offers a range of modules for working with and converting between Pandas and NumPy objects. In particular, it provides functions and classes for broadcasting, combining and wrapping NumPy arrays, grouping columns, managing [MultiIndex](https://pandas.pydata.org/pandas-docs/stable/user_guide/advanced.html), and more. These operations are essential for extending Pandas and replicating some of its functionality in custom classes.

### Grouping[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#grouping "Permanent link")

Since vectorbt usually associates with processing multi-column data, where each column (or "line") represents a separate backtesting instance, the ability to group those columns into some sort of groups is a must-have feature.

Class [Grouper](https://vectorbt.pro/pvt_40509f46/api/base/grouping/#vectorbtpro.base.grouping.base.Grouper) implements functionality to validate and build groups of any Pandas Index, especially columns. It's capable of translating various metadata such as [GroupBy objects](https://pandas.pydata.org/docs/reference/groupby.html) and column levels into special NumPy arrays that can be used by Numba-compiled functions to aggregate multiple columns of data. This is especially useful for multi-asset portfolios where each group is composed of one or more assets.

```
>>> columns = pd.MultiIndex.from_tuples([
...     ('BTC-USD', 'group1'), 
...     ('ETH-USD', 'group1'), 
...     ('ADA-USD', 'group2'),
...     ('SOL-USD', 'group2')
... ], names=['symbol', 'group'])
>>> vbt.Grouper(columns, 'group').get_groups()
array([0, 0, 1, 1])

```

### Indexing[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#indexing "Permanent link")

The main purpose of indexing in vectorbt is to provide Pandas indexing to any custom class holding Pandas-like objects, in particular, to select rows, columns, and groups in each. This is done by forwarding a Pandas indexing operation to each Pandas-like object and instantiating the class using them, which is fairly easy using [Configured](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured). This way, one can index complex classes with dozens of Pandas-like objects using a single command.

The main indexer class [PandasIndexer](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.PandasIndexer) mimics a regular Pandas object by exposing properties [PandasIndexer.iloc](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.PandasIndexer.iloc), [PandasIndexer.loc](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.PandasIndexer.loc), and [PandasIndexer.xs](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.PandasIndexer.xs). All we have to do is to subclass this class and override [IndexingBase.indexing\_func](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.IndexingBase.indexing_func), which should take `pd_indexing_func`, apply it on each Pandas-like object, and initialize a new instance.

Let's extend our newly created `CorrStats` class with Pandas indexing:

```
>>> class CorrStats(vbt.Configured, vbt.PandasIndexer):
...     def __init__(self, obj1, obj2):
...         vbt.Configured.__init__(self, obj1=obj1, obj2=obj2)
...         vbt.PandasIndexer.__init__(self)
...
...         self._obj1 = obj1
...         self._obj2 = obj2
...
...     def indexing_func(self, pd_indexing_func):  
...         return self.replace(
...             obj1=pd_indexing_func(self.obj1),
...             obj2=pd_indexing_func(self.obj2)
...         )
...
...     @property
...     def obj1(self):
...         return self._obj1
...
...     @property
...     def obj2(self):
...         return self._obj2
...
...     def corr(self):
...         if isinstance(self.obj1, pd.Series):
...             return self.obj1.corr(self.obj2)
...         return self.obj1.corrwith(self.obj2)
...
...     def rolling_corr(self, window):
...         return self.obj1.rolling(window).corr(self.obj2)

>>> corrstats = CorrStats(df1, df2)
>>> corrstats.corr()
a    0.3
b   -0.3
dtype: float64

>>> corrstats.loc['2020-01-01':'2020-01-03', 'a'].corr()  
0.24019223070763066

```

We just indexed two Pandas objects as a single entity. Yay!

### Wrapping[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#wrapping "Permanent link")

Remember how vectorbt specializes at taking a Pandas object, extracting its NumPy array, processing the array, and converting the results back into a Pandas format? The last part is done by the class [ArrayWrapper](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper), which captures all the necessary metadata, such as the index, columns, and number of dimensions, and exposes methods such as [ArrayWrapper.wrap](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.wrap) to convert a NumPy object back into a Pandas format.

Class [ArrayWrapper](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper) combines many concepts we introduced earlier to behave just like a (supercharged) Pandas object. In particular, it uses [Grouping](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#grouping) to build and manage groups of columns, and [Indexing](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#indexing) to select rows, columns, and groups using Pandas indexing. Probably the most powerful features of an array wrapper is 1) the ability to behave like a grouped object, which isn't possible with Pandas alone, and 2) the ability to translate a Pandas indexing operation to a range of integer arrays that can be used to index NumPy arrays. The latter allows indexing without the need to hold Pandas objects, only the wrapper.

We can construct a wrapper in multiple ways, the easiest being using a Pandas object:

```
>>> df = pd.DataFrame({
...     'a': range(0, 5),
...     'b': range(5, 10),
...     'c': range(10, 15),
...     'd': range(15, 20)
... }, index=index)
>>> wrapper = vbt.ArrayWrapper.from_obj(df)
>>> print(wrapper)
ArrayWrapper(
    index=<DatetimeIndex object at 0x7ff6d8528d68 of shape (5,)>,
    columns=<Index object at 0x7ff6d857fcc0 of shape (4,)>,
    ndim=2,
    freq=None,
    column_only_select=None,
    group_select=None,
    grouped_ndim=None,
    grouper=Grouper(
        index=<Index object at 0x7ff6d857fcc0 of shape (4,)>,
        group_by=None,
        allow_enable=True,
        allow_disable=True,
        allow_modify=True
    )
)

```

Let's create a function that sums all elements over each column using NumPy and returns a regular Pandas object:

```
>>> def sum_per_column(df):
...     wrapper = vbt.ArrayWrapper.from_obj(df)
...     result = np.sum(df.values, axis=0)
...     return wrapper.wrap_reduced(result)

>>> sum_per_column(df)
a    10
b    35
c    60
d    85
dtype: int64

```

The function above is already 20x faster than Pandas ![🤯](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f92f.svg ":exploding_head:")

```
>>> big_df = pd.DataFrame(np.random.uniform(size=(1000, 1000)))

>>> %timeit big_df.sum()
2.52 ms ± 3.5 µs per loop (mean ± std. dev. of 7 runs, 100 loops each)

>>> %timeit sum_per_column(big_df)
428 µs ± 1.5 µs per loop (mean ± std. dev. of 7 runs, 1000 loops each)

```

Since [ArrayWrapper](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper) can manage groups of columns, let's adapt our function to sum all elements over each group of columns:

```
>>> def sum_per_group(df, group_by):
...     wrapper = vbt.ArrayWrapper.from_obj(df, group_by=group_by)
...     results = []
...     for group_idxs in wrapper.grouper.iter_group_idxs():
...         group_result = np.sum(df.values[:, group_idxs])
...         results.append(group_result)
...     return wrapper.wrap_reduced(results)

>>> sum_per_group(df, False)  
a    10
b    35
c    60
d    85
dtype: int64

>>> sum_per_group(df, True)  
190

>>> group_by = pd.Index(['group1', 'group1', 'group2', 'group2'])
>>> sum_per_group(df, group_by)  
group1     45
group2    145
dtype: int64

```

To avoid creating multiple array wrappers with the same metadata, there is the class [Wrapping](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.Wrapping), which binds a single instance of [ArrayWrapper](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper) to manage an arbitrary number of shape-compatible array-like objects. Instead of accepting multiple Pandas objects, it takes an array wrapper, and all other objects and arrays in any format (preferably NumPy), and wraps them using this wrapper. Additionally, any [Wrapping](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.Wrapping) subclass can utilize its wrapper to perform Pandas indexing on any kind of objects, including NumPy arrays, because [ArrayWrapper](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper) can translate a Pandas indexing operation into universal row, column, and group indices.

Coming back to our `CorrStats` class. There are two issues with the current implementation:

1.  Both metrics require Pandas objects of identical layouts as inputs
2.  Both metrics are computed using Pandas, which is rather slow

Let's upgrade our `CorrStats` class to work on NumPy arrays and with an array wrapper:

```
>>> class CorrStats(vbt.Wrapping):
...     _expected_keys = vbt.Wrapping._expected_keys | {"obj1", "obj2"}  
...
...     @classmethod
...     def from_objs(cls, obj1, obj2):  
...         (obj1, obj2), wrapper = vbt.broadcast(
...             obj1, obj2, 
...             to_pd=False,
...             return_wrapper=True
...         )
...         return cls(wrapper, obj1, obj2)
...
...     def __init__(self, wrapper, obj1, obj2):
...         vbt.Wrapping.__init__(self, wrapper, obj1=obj1, obj2=obj2)
...
...         self._obj1 = vbt.to_2d_array(obj1)
...         self._obj2 = vbt.to_2d_array(obj2)
...
...     def indexing_func(self, pd_indexing_func, **kwargs):  
...         wrapper_meta = self.wrapper.indexing_func_meta(pd_indexing_func, **kwargs)
...         new_wrapper = wrapper_meta["new_wrapper"]
...         row_idxs = wrapper_meta["row_idxs"]
...         col_idxs = wrapper_meta["col_idxs"]
...         return self.replace(
...             wrapper=new_wrapper,
...             obj1=self.obj1[row_idxs, :][:, col_idxs],
...             obj2=self.obj2[row_idxs, :][:, col_idxs]
...         )
...
...     @property
...     def obj1(self):
...         return self._obj1
...
...     @property
...     def obj2(self):
...         return self._obj2
...
...     def corr(self):  
...         out = vbt.nb.nancorr_nb(self.obj1, self.obj2)
...         return self.wrapper.wrap_reduced(out)
...
...     def rolling_corr(self, window):
...         out = vbt.nb.rolling_corr_nb(
...             self.obj1, self.obj2, 
...             window, minp=window)
...         return self.wrapper.wrap(out)

```

As you might have noticed, we replaced the superclasses [Configured](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Configured) and [PandasIndexer](https://vectorbt.pro/pvt_40509f46/api/base/indexing/#vectorbtpro.base.indexing.PandasIndexer) with a single superclass [Wrapping](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.Wrapping), which already inherits them both. Another change applies to the arguments taken by `CorrStats`: instead of taking two Pandas objects, it now takes `wrapper` of type [ArrayWrapper](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper) along with the NumPy arrays `obj1` and `obj2`. This has several benefits: we're keeping Pandas metadata consistent and managed by a single variable, while all actions are efficiently performed using NumPy alone. Whenever there is a need to present the findings, we can call [ArrayWrapper.wrap\_reduced](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.wrap_reduced) and [ArrayWrapper.wrap](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.wrap) to transform them back into a Pandas format, which is done inside the methods `CorrStats.corr` and `CorrStats.rolling_corr` respectively.

Since we don't want to force ourselves and the user to create an array wrapper manually, we also implemented the class method `CorrStats.from_objs`, which broadcasts both arrays and instantiates `CorrStats`. This way, we can provide array-like objects of any kind and `CorrStats` will automatically build the wrapper for us. Let's illustrate this by computing the correlation coefficient for `df1` and `df2`, and then for `df1` and parametrized `df2`:

```
>>> df1.corrwith(df2)  
a    0.3
b   -0.3
dtype: float64

>>> corrstats = CorrStats.from_objs(df1, df2)
>>> corrstats.corr()  
a    0.3
b   -0.3
dtype: float64

>>> df2_sh = vbt.pd_acc.concat(
...     df2, df2.vbt.shuffle(seed=42), 
...     keys=['plain', 'shuffled'])
>>> df2_sh 
              plain    shuffled   
               a  b        a  b
2020-01-01     1  5        2  2
2020-01-02     2  4        5  4
2020-01-03     3  3        3  3
2020-01-04     4  2        1  5
2020-01-05     5  1        4  1

>>> df1.corrwith(df2_sh)  
ValueError: cannot join with no overlapping index names

>>> corrstats = CorrStats.from_objs(df1, df2_sh)
>>> corrstats.corr()  
plain     a    0.3
          b   -0.3
shuffled  a    0.4
          b   -0.9
dtype: float64

```

Here's why we ditched Pandas in favor of Numba:

```
>>> big_df1 = pd.DataFrame(np.random.uniform(size=(1000, 1000)))
>>> big_df2 = pd.DataFrame(np.random.uniform(size=(1000, 1000)))

>>> %timeit big_df1.rolling(10).corr(big_df2)  
271 ms ± 13.2 ms per loop (mean ± std. dev. of 7 runs, 1 loop each)

>>> corrstats = CorrStats.from_objs(big_df1, big_df2)
>>> %timeit corrstats.rolling_corr(10)  
12 ms ± 50.5 µs per loop (mean ± std. dev. of 7 runs, 1 loop each)

```

Another addition we made concerns indexing. Since `obj1` and `obj2` are not regular Pandas objects anymore, we cannot simply apply `pd_indexing_func` on them. Instead, we can use the method [ArrayWrapper.indexing\_func\_meta](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.ArrayWrapper.indexing_func_meta) to get the rows, columns, and groups that this operation would select. We then apply those arrays on both NumPy objects. This approach is exceptionally useful because now we can select any data from the final shape:

```
>>> corrstats = CorrStats.from_objs(df1, df2_sh)
>>> corrstats.loc['2020-01-02':'2020-01-05'].rolling_corr(3)  
                         plain            shuffled
                   a         b         a         b
2020-01-02       NaN       NaN       NaN       NaN
2020-01-03       NaN       NaN       NaN       NaN
2020-01-04 -0.327327  0.327327  0.327327 -0.981981
2020-01-05  0.500000 -0.240192 -0.654654 -0.960769

```

Note

Not all classes support indexing on rows. To make sure you can select rows, check whether the instance property `column_only_select` is False.

That's how most high-tier classes in vectorbt are built. As a rule of thumb:

### Base accessor[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#base-accessor "Permanent link")

This subpackage also contains the accessor [BaseAccessor](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor), which exposes many basic operations to the end user and is being subclassed by all other accessors. It inherits [Wrapping](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.Wrapping) and thus we can do with it everything what we can do with our custom `CorrStats` class. Why calling an accessor a "base" accessor? Because it is the superclass of all other accessors in vectorbt and provides them with the core combining, reshaping, and indexing functions, such as [BaseAccessor.to\_2d\_array](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.to_2d_array) to convert a Pandas object into a two-dimensional NumPy array.

The "access" to the accessor is simple:

```
>>> df.vbt
<vectorbtpro.accessors.Vbt_DFAccessor at 0x7fe3c19f7d68>

>>> df.vbt.to_2d_array()
array([[ 0,  5, 10, 15],
       [ 1,  6, 11, 16],
       [ 2,  7, 12, 17],
       [ 3,  8, 13, 18],
       [ 4,  9, 14, 19]])

```

In the example above, [Vbt\_DFAccessor](https://vectorbt.pro/pvt_40509f46/api/accessors/#vectorbtpro.accessors.Vbt_DFAccessor) is the main accessor for DataFrames, and as you can see in its definition, [BaseAccessor](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor) appears in its superclasses.

Probably the most interesting is the method [BaseAccessor.combine](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor.combine), which allows for broadcasting and combining the current Pandas object with an arbitrary number of other array-like objects given the function `combine_func` (mainly using NumPy).

```
>>> pd.Series([1, 2, 3]).vbt.combine(np.array([[4, 5, 6]]), np.add)
   0  1  2
0  5  6  7
1  6  7  8
2  7  8  9

```

[BaseAccessor](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor) implements a range of [unary](https://vectorbt.pro/pvt_40509f46/api/utils/magic_decorators/#vectorbtpro.utils.magic_decorators.unary_magic_config) and [binary](https://vectorbt.pro/pvt_40509f46/api/utils/magic_decorators/#vectorbtpro.utils.magic_decorators.binary_magic_config) magic methods using this method. For example, let's invoke `BaseAccessor.__add__`, which implements addition:

```
>>> pd.Series([1, 2, 3]) + np.array([[4, 5, 6]])  
ValueError: Length of values (1) does not match length of index (3)

>>> pd.Series([1, 2, 3]).vbt + np.array([[4, 5, 6]])  
   0  1  2
0  5  6  7
1  6  7  8
2  7  8  9

```

All of these magic methods were added using class decorators. There are a lot of class decorators for all kind of things in vectorbt. Usually, they take a config and attach many attributes at once in some automated way.

## Generic[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#generic "Permanent link")

graph TD;
    GenericAccessor -->|inherits| Analyzable;
    GenericAccessor -->|inherits| BaseAccessor;
    Analyzable -->|inherits| Wrapping;
    Analyzable -->|inherits| StatsBuilderMixin;
    BaseAccessor -->|inherits| PlotsBuilderMixin;

    style GenericAccessor stroke:#635bff,stroke-width:2px;
    style Analyzable stroke:#635bff,stroke-width:2px;
    style BaseAccessor stroke:#635bff,stroke-width:2px;
    style Wrapping stroke:#635bff,stroke-width:2px;
    style StatsBuilderMixin stroke:#635bff,stroke-width:2px;
    style PlotsBuilderMixin stroke:#635bff,stroke-width:2px;


Subpackage [generic](https://vectorbt.pro/pvt_40509f46/api/generic/) is the computational core of vectorbt. It contains modules for processing and plotting time series and numeric data in general. More importantly: it implements an [arsenal](https://vectorbt.pro/pvt_40509f46/api/generic/nb/) of Numba-compiled functions for accelerating and extending Pandas! Those functions are powering many corners of vectorbt, from indicators to portfolio analysis. But for now, let's focus on classes that could make our `CorrStats` class more powerful.

### Builder mixins[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#builder-mixins "Permanent link")

Builder [mixins](https://en.wikipedia.org/wiki/Mixin) are classes that, once subclassed by a class, allow to build a specific functionality from this class' attributes. There are two prominent members: [StatsBuilderMixin](https://vectorbt.pro/pvt_40509f46/api/generic/stats_builder/#vectorbtpro.generic.stats_builder.StatsBuilderMixin) and [PlotsBuilderMixin](https://vectorbt.pro/pvt_40509f46/api/generic/plots_builder/#vectorbtpro.generic.plots_builder.PlotsBuilderMixin). The former exposes the method [StatsBuilderMixin.stats](https://vectorbt.pro/pvt_40509f46/api/generic/stats_builder/#vectorbtpro.generic.stats_builder.StatsBuilderMixin.stats) to compute various metrics, while the latter exposes the method [PlotsBuilderMixin.plots](https://vectorbt.pro/pvt_40509f46/api/generic/plots_builder/#vectorbtpro.generic.plots_builder.PlotsBuilderMixin.plots) to display various subplots. Both are subclassed by almost every class that can analyze data.

### Analyzing[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#analyzing "Permanent link")

Class [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable) combines [Wrapping](https://vectorbt.pro/pvt_40509f46/api/base/wrapping/#vectorbtpro.base.wrapping.Wrapping) and [Builder mixins](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#builder-mixins). It combines everything we introduced above to build a foundation for a seamless data analysis; that's why it's being subclassed by so many high-tier classes, such as [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) and [Records](https://vectorbt.pro/pvt_40509f46/api/records/base/#vectorbtpro.records.base.Records).

What are we waiting for? Let's adapt our `CorrStats` class to become analyzable!

```
>>> class CorrStats(vbt.Analyzable):  
...     _expected_keys = vbt.Analyzable._expected_keys | {"obj1", "obj2"}
...
...     @classmethod
...     def from_objs(cls, obj1, obj2):
...         (obj1, obj2), wrapper = vbt.broadcast(
...             obj1, obj2, 
...             to_pd=False,
...             return_wrapper=True
...         )
...         return cls(wrapper, obj1, obj2)
...
...     def __init__(self, wrapper, obj1, obj2):
...         vbt.Analyzable.__init__(self, wrapper, obj1=obj1, obj2=obj2)  
...
...         self._obj1 = vbt.to_2d_array(obj1)
...         self._obj2 = vbt.to_2d_array(obj2)
...
...     def indexing_func(self, pd_indexing_func, **kwargs):
...         wrapper_meta = self.wrapper.indexing_func_meta(pd_indexing_func, **kwargs)
...         new_wrapper = wrapper_meta["new_wrapper"]
...         row_idxs = wrapper_meta["row_idxs"]
...         col_idxs = wrapper_meta["col_idxs"]
...         return self.replace(
...             wrapper=new_wrapper,
...             obj1=self.obj1[row_idxs, :][:, col_idxs],
...             obj2=self.obj2[row_idxs, :][:, col_idxs]
...         )
...
...     @property
...     def obj1(self):
...         return self._obj1
...
...     @property
...     def obj2(self):
...         return self._obj2
...
...     def corr(self):
...         out = vbt.nb.nancorr_nb(self.obj1, self.obj2)
...         return self.wrapper.wrap_reduced(out)
...
...     def rolling_corr(self, window):
...         out = vbt.nb.rolling_corr_nb(
...             self.obj1, self.obj2, 
...             window, minp=window)
...         return self.wrapper.wrap(out)
...
...     _metrics = vbt.HybridConfig(  
...         corr=dict(
...             title='Corr. Coefficient',
...             calc_func='corr'
...         )
...     )
...
...     _subplots = vbt.HybridConfig(  
...          rolling_corr=dict(
...              title=vbt.Sub("Rolling Corr. Coefficient (window=$window)"),
...              plot_func=vbt.Sub('rolling_corr($window).vbt.plot'),  
...              pass_trace_names=False
...          )
...     )

```

We changed a few things: replaced `Wrapping` with `Analyzable`, and added some metrics and subplots based on `CorrStats.corr` and `CorrStats.rolling_corr`. That's it! We can now pass arbitrary array-like objects to `CorrStats.from_objs` and it will return an instance that can be used to analyze the correlation between the objects, in particular using `CorrStats.stats` and `CorrStats.plots`:

```
>>> corrstats = CorrStats.from_objs(df1, df2)
>>> corrstats.stats(column='a')  
Corr. Coefficient    0.3
Name: a, dtype: object

>>> corrstats['a'].stats()  
Corr. Coefficient    0.3
Name: a, dtype: object

>>> corrstats.plots(template_context=dict(window=3)).show()  

```

![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/bblocks/analyzing.light.svg#only-light) ![](https://vectorbt.pro/pvt_40509f46/assets/images/documentation/bblocks/analyzing.dark.svg#only-dark)

There is nothing more satisfying than not having to write boilerplate code. Thanks to [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable), we can shift our focus entirely to analysis, while vectorbt takes care of everything else.

### Generic accessor[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#generic-accessor "Permanent link")

We don't have to look far to find a class that inherits [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable): class [GenericAccessor](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor) extends the class [BaseAccessor](https://vectorbt.pro/pvt_40509f46/api/base/accessors/#vectorbtpro.base.accessors.BaseAccessor) to deliver statistics and plots for any numeric data. It's a size-that-fits-all class with an objective to replicate, accelerate, and extend Pandas' core functionality. It implements in-house rolling, mapping, reducing, splitting, plotting, and many other kinds of methods, which can be used on any Series or DataFrame in the wild.

In a nutshell, [GenericAccessor](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor) does the following:

-   Wraps many Numba-compiled functions from [nb](https://vectorbt.pro/pvt_40509f46/api/generic/nb/) module and offers them as methods that mimic some of the Pandas most popular functions. Some of them have meta versions (accepting UDFs that take metadata instead of arrays) or can work on grouped data.
-   Wraps many data transformation utilities from [scikit-learn](https://scikit-learn.org/stable/)
-   Displays a range of statistics similar to [pandas.DataFrame.describe](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.describe.html)
-   Wraps widgets from [plotting](https://vectorbt.pro/pvt_40509f46/api/generic/plotting/) and provides many custom plotting methods. Some of them even support interactive controls for analyzing groups of data.
-   Extracts basic events in form of [Records](https://vectorbt.pro/pvt_40509f46/api/records/base/#vectorbtpro.records.base.Records), such as drawdowns

Similarly to the [Base accessor](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#base-accessor), the generic accessor uses [class decorators](https://vectorbt.pro/pvt_40509f46/api/generic/decorators/) and [configs](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.nb_config) to attach many Numba-compiled and scikit-learn functions at once.

Usage is similar to `CorrStats`, except that we can call the generic accessor directly on Pandas objects since it's being directly subclassed by [Vbt\_DFAccessor](https://vectorbt.pro/pvt_40509f46/api/accessors/#vectorbtpro.accessors.Vbt_DFAccessor)!

```
>>> df.vbt.stats(column='a')
Start        2020-01-01 00:00:00
End          2020-01-05 00:00:00
Period           5 days 00:00:00
Count                          5
Mean                         2.0
Std                     1.581139
Min                            0
Median                       2.0
Max                            4
Min Index    2020-01-01 00:00:00
Max Index    2020-01-05 00:00:00
Name: a, dtype: object

```

## Records[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#records "Permanent link")

graph TD;
    Records -.->|references| MappedArray;
    MappedArray -.->|references| ColumnMapper;
    MappedArray -->|inherits| Analyzable;
    ColumnMapper -.->|references| MappedArray;

    style Records stroke:#635bff,stroke-width:2px;
    style MappedArray stroke:#635bff,stroke-width:2px;
    style ColumnMapper stroke:#635bff,stroke-width:2px;
    style Analyzable stroke:#635bff,stroke-width:2px;


Records are [structured arrays](https://numpy.org/doc/stable/user/basics.rec.html) - a NumPy array that can hold different data types, just like a Pandas DataFrame. Records have one big advantage over DataFrames though: they are well understood by Numba, thus we can generate and use them efficiently. So, what's the catch? Records have no (index) labels and the API is very limited. We also [learned](https://vectorbt.pro/pvt_40509f46/documentation/fundamentals/) that vectorbt doesn't like heterogenous data and prefers to work with multiple homogeneous arrays (remember how we need to split OHLC into O, H, L, and C?). Nevertheless, they take a very important place in our ecosystem - as containers for event data.

Trading is all about events: executing trades, aggregating them into positions, analyzing drawdowns, and much more. Each of such events is a complex piece of data that needs a container optimized for fast writes and reads, especially inside a Numba-compiled code (but please not a list of dictionaries, they are **very inefficient**). Structured arrays is exactly the data structure we need! Each event is a record that holds all the required information, such the column and row where it originally happened.

Because structured arrays are hard to analyze, there is a class just for this - [Records](https://vectorbt.pro/pvt_40509f46/api/records/base/#vectorbtpro.records.base.Records)! By subclassing [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable) (suprise, surprise), it wraps a structured NumPy array and provides us with useful tools for its analysis. Every [Records](https://vectorbt.pro/pvt_40509f46/api/records/base/#vectorbtpro.records.base.Records) instance can be indexed just like a regular Pandas object and compute various metrics and plot graphs.

Let's generate the [Drawdowns](https://vectorbt.pro/pvt_40509f46/api/generic/drawdowns/#vectorbtpro.generic.drawdowns.Drawdowns) records for two columns of time series data:

```
>>> dd_df = pd.DataFrame({
...     'a': [10, 11, 12, 11, 12, 13, 12],
...     'b': [14, 13, 12, 11, 12, 13, 14]
... }, index=vbt.date_range("2020", periods=7))
>>> drawdowns = dd_df.vbt.drawdowns
>>> drawdowns.readable
   Drawdown Id Column Start Index Valley Index  End Index  Start Value  \
0            0      a  2020-01-03   2020-01-04 2020-01-05         12.0   
1            1      a  2020-01-06   2020-01-07 2020-01-07         13.0   
2            0      b  2020-01-01   2020-01-04 2020-01-07         14.0   

   Valley Value  End Value     Status  
0          11.0       12.0  Recovered  
1          12.0       12.0     Active  
2          11.0       14.0  Recovered  

>>> drawdowns['b'].readable  
   Drawdown Id Column Start Index Valley Index  End Index  Start Value  \
0            0      b  2020-01-01   2020-01-04 2020-01-07         14.0   

   Valley Value  End Value     Status  
0          11.0       14.0  Recovered  

```

That's a lot of information! Each field is a regular NumPy array, so where do we get this rich information from? Maybe to your surprise, but the labels of the DataFrames above were auto-generated from the metadata that [Drawdowns](https://vectorbt.pro/pvt_40509f46/api/generic/drawdowns/#vectorbtpro.generic.drawdowns.Drawdowns) holds. This metadata is called a "field config" - a regular [Config](https://vectorbt.pro/pvt_40509f46/api/utils/config/#vectorbtpro.utils.config.Config) that describes each field (for instance, [Drawdowns.field\_config](https://vectorbt.pro/pvt_40509f46/api/generic/drawdowns/#vectorbtpro.generic.drawdowns.Drawdowns.field_config)). This makes possible automating and enhancing the behavior of each field. Class [Records](https://vectorbt.pro/pvt_40509f46/api/records/base/#vectorbtpro.records.base.Records), the base class to all records classes, has many methods to read and interpret this config.

```
>>> drawdowns.status.values  
array([1, 0, 1])

>>> drawdowns.get_apply_mapping_arr('status')  
array(['Recovered', 'Active', 'Recovered'], dtype=object)

```

### Column mapper[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#column-mapper "Permanent link")

Records are one-dimensional structured NumPy arrays. Records from multiple columns are concatenated into a single array, so we need a mechanism to group them by column or group, for instance, to aggregate values column-wise. This is a non-trivial task because finding the records that correspond to a specific column requires searching all records, which is slow when done repeatedly. The task of the class [ColumnMapper](https://vectorbt.pro/pvt_40509f46/api/records/col_mapper/#vectorbtpro.records.col_mapper.ColumnMapper) is to index all columns only once and cache the result (see [ColumnMapper.col\_map](https://vectorbt.pro/pvt_40509f46/api/records/col_mapper/#vectorbtpro.records.col_mapper.ColumnMapper.col_map)). A column mapper has at least two more advantages: it allows for grouping columns and enables efficient [Indexing](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#indexing).

```
>>> drawdowns.col_mapper.col_map  
(array([0, 1, 2]), array([2, 1]))

```

The produced column map means that the column `a` has two records at indices 0 and 1, while the column `b` is represented by only one record at index 2.

### Mapped arrays[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#mapped-arrays "Permanent link")

If [Records](https://vectorbt.pro/pvt_40509f46/api/records/base/#vectorbtpro.records.base.Records) is our own DataFrame for events, then [MappedArray](https://vectorbt.pro/pvt_40509f46/api/records/mapped_array/#vectorbtpro.records.mapped_array.MappedArray) is our own Series! Each field in records can be mapped into a _mapped_ array. In fact, a mapped array is where most calculations take place. It's just like [GenericAccessor](https://vectorbt.pro/pvt_40509f46/api/generic/accessors/#vectorbtpro.generic.accessors.GenericAccessor), but with a totally different representation of data: one-dimensional and clustered instead of two-dimensional and column-wise. We can even seemingly convert between both representations. Why wouldn't we then simply convert a mapped array into a regular Series and do all the analysis there? There are several reasons:

1.  Event data is usually sparse: If 1,000,000 data points produced 50 events, it's much faster to analyze 50 values then having to convert them back and deal with 9,999,950 NaNs.
2.  Multiple events, such as orders, can happen within the same bar, which cannot be represented in Pandas efficiently

Let's analyze the drawdown values of `drawdowns`:

```
>>> dd_ma = drawdowns.drawdown
>>> dd_ma
<vectorbtpro.records.mapped_array.MappedArray at 0x7ff6d8514f98>

>>> dd_ma.values  
array([-0.08333333, -0.07692308, -0.21428571])

>>> dd_ma.stats(column='a')
Start        2020-01-01 00:00:00
End          2020-01-07 00:00:00
Period           7 days 00:00:00
Count                          2
Mean                   -0.080128
Std                     0.004533
Min                    -0.083333
Median                 -0.080128
Max                    -0.076923
Min Index    2020-01-05 00:00:00
Max Index    2020-01-07 00:00:00
Name: a, dtype: object

>>> dd_ma.to_pd()  
                   a         b
2020-01-01       NaN       NaN
2020-01-02       NaN       NaN
2020-01-03       NaN       NaN
2020-01-04       NaN       NaN
2020-01-05 -0.083333       NaN
2020-01-06       NaN       NaN
2020-01-07 -0.076923 -0.214286

```

Thanks to [ColumnMapper](https://vectorbt.pro/pvt_40509f46/api/records/col_mapper/#vectorbtpro.records.col_mapper.ColumnMapper) and [Analyzable](https://vectorbt.pro/pvt_40509f46/api/generic/analyzable/#vectorbtpro.generic.analyzable.Analyzable), we can select rows and columns from a mapped array the same way as from records or any regular Pandas object:

```
>>> dd_ma['b'].values
array([-0.21428571])

```

## Summary[¶](https://vectorbt.pro/pvt_40509f46/documentation/building-blocks/#summary "Permanent link")

Kudos for following me all the way down here! The classes that we just covered build a strong foundation for data analysis with vectorbt; they implement design patterns that are encountered in most other places across the codebase, which makes them very easy to recognize and extend. In fact, the most hard-core class [Portfolio](https://vectorbt.pro/pvt_40509f46/api/portfolio/base/#vectorbtpro.portfolio.base.Portfolio) is very similar to our `CorrStats`.

You're now more than ready for using vectorbt, soldier ![🌟](https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.0.3/assets/svg/1f31f.svg ":star2:")

[Python code](https://vectorbt.pro/pvt_40509f46/assets/jupytext/documentation/building-blocks.py.txt)