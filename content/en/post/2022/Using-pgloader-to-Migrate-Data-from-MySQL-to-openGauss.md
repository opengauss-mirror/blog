+++

title = "Using pgloader to Migrate Data from MySQL to openGauss"

date = "2021-5-27"

tags = [ "Using pgloader to Migrate Data from MySQL to openGauss"]

archives = "2021-5"

author = "Ju Peng"

summary = "Using pgloader to Migrate Data from MySQL to openGauss"

img = "/en/post/2022/title/img13.png"

times = "12:30"

+++

# Using pgloader to Migrate Data from MySQL to openGauss<a name="ZH-CN_TOPIC_0000001206466688"></a>

## Introduction to pgloader<a name="section15861328194115"></a>

pgloader is a data import tool that uses the COPY command to import data to PostgreSQL. pgloader works in two modes: importing data from files and migrating databases. In both modes, pgloader uses the COPY protocol of PostgreSQL to efficiently transfer data.

openGauss is compatible with PostgreSQL communication protocols and most syntaxes. For this reason, you can use pgloader to migrate data from MySQL to openGauss.

## pgloader Issues in openGauss<a name="section178632028164113"></a>

openGauss performs security hardening on native PostgreSQL communication protocols. As a result, it is incompatible with the default PostgreSQL communication protocols, and by default, the native PostgreSQL that uses pgloader cannot connect to openGauss. An error similar to the following is reported:

![](figures/zh-cn_image_0000001252128947.jpg)

The solution is to modify the GUC parameter. The involved GUC parameter is  **password\_encryption\_type**. By default, PostgreSQL uses MD5 encryption, which is insecure. To improve the security capabilities of openGauss, openGauss uses SHA256 encryption by default. Therefore, the preceding error is reported. openGauss does not delete MD5 encryption and its verification logic. As such, MD5 encryption can be enabled by setting the GUC parameter.

Method:

**_gs\_guc reload -D $PGDATA -c "password\_encryption\_type = 1"_**

**You must create a user after setting the preceding parameter.**  Then, you can log in to the database as the user.

Next, use pgloader to migrate data from MySQL to openGauss.

## Installing pgloader<a name="section3864142814416"></a>

You can install pgloader directly from apt.postgresql.org or the official Debian repository at packages.debian.org/pgloader.

**_$ apt-get install pgloader_**

You can also directly use pgloader through Docker images.

**_$ docker pull dimitri/pgloader_**

**_$ docker run --rm --name pgloader dimitri/pgloader:latest pgloader --version_**

**_$ docker run --rm --name pgloader dimitri/pgloader:latest pgloader –help_**

## Configuring pgloader<a name="section586513284417"></a>

pgloader provides various configuration items for you to customize migration operations. For example, you can run the  **include drop**  command to delete all tables whose names appear in MySQL in the target database, so that the tool can be started automatically in a clean environment by running the same command for multiple consecutive times.

The following describes some common configuration items.

**FROM**: URL of the source database. The format is as follows:

```
  mysql://[user[:password]@][netloc][:port][/dbname][?option=value&...]
```

**INTO**: URL of the target database. The format is as follows:

```
  postgresql://[user[:password]@][netloc][:port][/dbname][?option=value&...]
```

**WITH**: options when data is loaded from MySQL. The options are  **include drop**,  **create tables**, and  **create indexes**.  **CAST**: user-defined type conversion rule. You are allowed to overwrite existing default conversion rules or modify them in special cases.

For partial migration, you can use the configuration items  **including only table names matching**  and  **excluding table names matching**  to migrate only specific tables or exclude specific tables during migration.

For details about the configuration items, see the official website:

https://pgloader.readthedocs.io/en/latest/ref/mysql.html

The following is an example of the configuration file for migrating data from MySQL to openGauss:

```
LOAD DATABASE
FROM mysql://mysql_test:password123@1.1.1.1:3306/mysql_database
INTO postgresql://opengauss_test:password_123@1.1.1.1:5432/opengauss_database
 
WITH include drop, create tables, create indexes, reset no sequences,
      workers = 8, concurrency = 1,
      multiple readers per thread, rows per range = 50000
 
 CAST
 type varchar when(= 1 precision) to "boolean" drop typemod keep default keep not null;
```

The preceding configuration file indicates that the username and password for connecting to MySQL are  **mysql\_test**  and  **password123**  respectively during data migration. The IP address and port number of the MySQL server are  **1.1.1.1**  and  **3306**, respectively. The source database is  **mysql\_database**.

The username and password for connecting to openGauss are  **opengauss\_test**  and  **password\_123**, respectively. The IP address and port number of the openGauss server are  **1.1.1.1**  and  **5432**, respectively, and the target database is  **opengauss\_database**.

Note that the user must have the permission to remotely connect to MySQL and openGauss and the read and write permissions on the corresponding databases. For openGauss, the host where pgloader runs must be in the remote access whitelist of openGauss.

## Creating Users and Databases<a name="section1987618287413"></a>

This section describes how to create users and databases in openGauss required for migration.

![](figures/zh-cn_image_0000001251848955.jpg)

## Runing pgloader to Migrate Data<a name="section188779282414"></a>

The following shows how to install pgloader by using Docker images. Name the prepared configuration file  **openGauss.loader**.

![](figures/zh-cn_image_0000001251848959.jpg)

Run the  **docker run -tid --name pgloader\_test dimitri/pgloader**  command to start Docker.

Run the  **docker cp ./openGauss.loader pgloader\_test:/**  command to copy the configuration file to Docker.

Run the  **docker exec -it pgloader\_test /bin/bash**  command to access Docker.

![](figures/zh-cn_image_0000001252248915.jpg)

Run the  **pgloader openGauss.loader**  command to start pgloader, wait until the data migration is complete, and view the migration result report.

![](figures/zh-cn_image_0000001252008911.jpg)

View the migration result in openGauss.

![](figures/zh-cn_image_0000001206968992.jpg)

