+++  
title = "使用gsql元命令导入数据"   
date = "2022-08-19"  
tags = ["OpenGauss3.0.0"]  
archives = "2020-08"  
author = "wllovever"  
summary = "OpenGauss3.0.0"  
img = "/zh/post/wllove/title/title.png"  
times = "18:10"  
+++  

## 使用gsql元命令导入数据
gsql工具提供了元命令\copy进行数据导入。
copy元命令说明<br />语法：  

```
copy { table [ ( column_list ) ] |( query ) } { from | to } { filename |stdin | stdout | pstdin | pstdout }[ with ] [ binary ] [ delimiter[ as ] 'character' ] [ null [ as ] 'string' ][ csv [ header ] [ quote [ as ]
'character' ] [ escape [ as ] 'character' ][ force quote column_list | * ] [ force not null column_list ] ]
```

说明：
在任何gsql客户端登录数据库成功后，可以使用该命令进行数据的导入/导出。但是与SQL的COPY命令不同，该命令读取/写入的文件是本地文件，而非数据库服务器端文件；所以，要操作的文件的可访问性、权限等，都是受限于本地用户的权限。
说明：
COPY只适合小批量、格式良好的数据导入，不会对非法字符做预处理，也无容错能力，无法适用于含有异常数据的场景。导入数据应优先选择COPY。

## 参数说明

- table表的名称（可以有模式修饰）。取值范围：已存在的表名。
- column_list可选的待拷贝字段列表。取值范围：任意字段。如果没有声明字段列表，将使用所有字段。
- query其结果将被拷贝。取值范围：一个必须用圆括弧包围的SELECT或VALUES命令。
- filename文件的绝对路径。执行copy命令的用户必须有此路径的写权限。
- stdin声明输入是来自标准输入。
- stdout声明输出打印到标准输出。
- pstdin声明输入是来自gsql的标准输入。
- pstout
- 声明输出打印到gsql的标准输出。
- binary使用二进制格式存储和读取，而不是以文本的方式。在二进制模式下，不能声明DELIMITER、NULL、CSV选项。指定binary类型后，不能再通过option或copy_option指定CSV、FIXED、TEXT等类型。
- delimiter [ as ] 'character'指定数据文件行数据的字段分隔符。

注意事项：

- 分隔符不能是\r和\n。
- 分隔符不能和null参数相同，CSV格式数据的分隔符不能和quote参数相同。
- TEXT格式数据的分隔符不能包含： .abcdefghijklmnopqrstuvwxyz0123456789。
- 数据文件中单行数据长度需<1GB，如果分隔符较长且数据列较多的情况下，会影响导出有效数据的长度。
- 分隔符推荐使用多字符和不可见字符。多字符例如'$^&'；不可见字符例如0x07、0x08、0x1b等。

- 取值范围：支持多字符分隔符，但分隔符不能超过10个字节。默认值：
   - TEXT格式的默认分隔符是水平制表符（tab）。
   - CSV格式的默认分隔符为“,”。
   - FIXED格式没有分隔符。
- null [ as ] 'string'用来指定数据文件中空值的表示。取值范围：默认值：
   - null值不能是\r和\n，最大为100个字符。
   - null值不能和分隔符、quote参数相同。
   - CSV格式下默认值是一个没有引号的空字符串。
   - 在TEXT格式下默认值是\N。
- header指定导出数据文件是否包含标题行，标题行一般用来描述表中每个字段的信息。header只能用于CSV，FIXED格式的文件中。在导入数据时，如果header选项为on，则数据文本第一行会被识别为标题行，会忽略此行。如果header为off，而数据文件中第一行会被识别为数据。在导出数据时，如果header选项为on，则需要指定fileheader。fileheader是指定导出数据包含标题行的定义文件。如果header为off，则导出数据文件不包含标题行。取值范围：true/on，false/off。默认值：false
- quote [ as ] 'character'CSV格式文件下的引号字符。默认值：双引号。

（- quote参数不能和分隔符、null参数相同。
- quote参数只能是单字节的字符。
- 推荐不可见字符作为quote，例如0x07、0x08、0x1b等。）

- escape [ as ] 'character'CSV格式下，用来指定逃逸字符，逃逸字符只能指定为单字节字符。默认值：双引号。当与quote值相同时，会被替换为'\0'。
- force quote column_list | *在CSV COPY TO模式下，强制在每个声明的字段周围对所有非NULL值都使用引号包围。NULL输出不会被引号包围。取值范围：已存在的字段。
- force not null column_list在CSV COPY FROM模式下，指定的字段输入不能为空。取值范围：已存在的字段。


## 命令示例
创建目标表a。

```
CREATE TABLE a(a int); 导入数据。
```

从stdin拷贝数据到目标表a。

```
 \copy a from stdin;
```
出现>>符号提示时，输入数据，输入.时结束。

```
 Enter data to be copied followed by a newline.
End with a backslash and a period on a line by itself.
  >> 1    
>> 2   
>> 
```

查询导入目标表a的数据。

```
  openGauss=# SELECT * FROM a;
```

从本地文件拷贝数据到目标表a。假设存在本地文件/home/omm/2.csv。
分隔符为“，”。<br />在导入过程中，若数据源文件比外表定义的列数多，则忽略行尾多出来的列。

```
copy a FROM '/home/omm/2.csv' WITH (delimiter',',IGNORE_EXTRA_DATA 'on');
```

