+++

title = "从Oracle到openGauss：字典表DBA\_TABLES到tables对应" 

date = "2020-11-19" 

tags = ["从Oracle到openGauss：字典表DBA\_TABLES到tables对应"] 

archives = "2020-11" 

author = "盖国强" 

summary = "从Oracle到openGauss：字典表DBA\_TABLES到tables对应"

img = "/zh/post/gaiguoqiang/title/title.png" 

times = "14:30"

+++

# 从Oracle到openGauss：字典表DBA\_TABLES到tables对应<a name="ZH-CN_TOPIC_0293240557"></a>

从Oracle数据库向其他数据库过度时，很多朋友会自然而然的寻找属性都过度方式，例如字典表。

有人问，类似DBA\_TABLES，DBA\_TAB\_COLUMNS的字典，在openGauss中是否存在呢？

```
SELECT OWNER, TABLE_NAME FROM DBA_TABLES;

SELECT COLUMN_NAME, 
       DATA_TYPE, 
       DATA_LENGTH,
       COLUMN_ID, 
       DATA_PRECISION, 
       DATA_SCALE 
FROM DBA_TAB_COLUMNS
```

当然会存在对应关系：

ALL\_TABLES =\> information\_schema.tables

```
postgres=> \d information_schema.tables
                       View "information_schema.tables"
            Column            |               Type                | Modifiers 
------------------------------+-----------------------------------+-----------
 table_catalog                | information_schema.sql_identifier | 
 table_schema                 | information_schema.sql_identifier | 
 table_name                   | information_schema.sql_identifier | 
 table_type                   | information_schema.character_data | 
 self_referencing_column_name | information_schema.sql_identifier | 
 reference_generation         | information_schema.character_data | 
 user_defined_type_catalog    | information_schema.sql_identifier | 
 user_defined_type_schema     | information_schema.sql_identifier | 
 user_defined_type_name       | information_schema.sql_identifier | 
 is_insertable_into           | information_schema.yes_or_no      | 
 is_typed                     | information_schema.yes_or_no      | 
 commit_action                | information_schema.character_data |  
```

http://www.postgresql.org/docs/current/static/infoschema-tables.html

ALL\_TAB\_COLUMNS =\> information\_schema.columns

```
postgres=> \d information_schema.columns
                     View "information_schema.columns"
          Column          |                Type                | Modifiers 
--------------------------+------------------------------------+-----------
 table_catalog            | information_schema.sql_identifier  | 
 table_schema             | information_schema.sql_identifier  | 
 table_name               | information_schema.sql_identifier  | 
 column_name              | information_schema.sql_identifier  | 
 ordinal_position         | information_schema.cardinal_number | 
 column_default           | information_schema.character_data  | 
 is_nullable              | information_schema.yes_or_no       | 
 data_type                | information_schema.character_data  | 
 character_maximum_length | information_schema.cardinal_number | 
 character_octet_length   | information_schema.cardinal_number | 
 numeric_precision        | information_schema.cardinal_number | 
 numeric_precision_radix  | information_schema.cardinal_number | 
 numeric_scale            | information_schema.cardinal_number | 
 datetime_precision       | information_schema.cardinal_number | 
 interval_type            | information_schema.character_data  | 
 interval_precision       | information_schema.cardinal_number | 
 character_set_catalog    | information_schema.sql_identifier  | 
 character_set_schema     | information_schema.sql_identifier  | 
 character_set_name       | information_schema.sql_identifier  | 
 collation_catalog        | information_schema.sql_identifier  | 
 collation_schema         | information_schema.sql_identifier  | 
 collation_name           | information_schema.sql_identifier  | 
 domain_catalog           | information_schema.sql_identifier  | 
 domain_schema            | information_schema.sql_identifier  | 
 domain_name              | information_schema.sql_identifier  | 
 udt_catalog              | information_schema.sql_identifier  | 
 udt_schema               | information_schema.sql_identifier  | 
 udt_name                 | information_schema.sql_identifier  | 
 scope_catalog            | information_schema.sql_identifier  | 
 scope_schema             | information_schema.sql_identifier  | 
 scope_name               | information_schema.sql_identifier  | 
 maximum_cardinality      | information_schema.cardinal_number | 
 dtd_identifier           | information_schema.sql_identifier  | 
 is_self_referencing      | information_schema.yes_or_no       | 
 is_identity              | information_schema.yes_or_no       | 
 identity_generation      | information_schema.character_data  | 
 identity_start           | information_schema.character_data  | 
 identity_increment       | information_schema.character_data  | 
 identity_maximum         | information_schema.character_data  | 
 identity_minimum         | information_schema.character_data  | 
 identity_cycle           | information_schema.yes_or_no       | 
 is_generated             | information_schema.character_data  | 
 generation_expression    | information_schema.character_data  | 
 is_updatable             | information_schema.yes_or_no       | 
```

http://www.postgresql.org/docs/current/static/infoschema-columns.html

供参考。

