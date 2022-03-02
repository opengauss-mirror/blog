+++

title = "Permission Management Model of the openGauss Database"

date = "2021-7-26"

tags = [ "Permission Management Model of the openGauss Database"]

archives = "2021-7"

author = "Rongrong Song"

summary = "Permission Management Model of the openGauss Database"

img = "/en/post/2022/title/img3.png"

times = "12:30"

+++

#  Permission Management Model of the openGauss Database<a name="ZH-CN_TOPIC_0000001206306724"></a>

The database stores a large amount of important data and sensitive information and provides data sharing services for authorized users with different permissions. Therefore, the database must have a complete security defense mechanism to defend against internal and external malicious attacks, to ensure that data is not lost, privacy is not disclosed, and data is not tampered with. Currently, the openGauss database has built an in-depth defense security system to enhance database security in applications. A complete permission management mechanism can effectively block unauthorized operations of malicious users. This document focuses on the permission management mechanism in the openGauss database.

## 1 Common Permission Management Models<a name="section176511545145713"></a>

There are three common permission management models: policy-based access control model, role-based access control model, and session- and role-based access control model. The openGauss database inherits the permission management mechanism of PostgreSQL, adopts the role-based access control model, and uses roles to organize and manage permissions, greatly simplifying permission authorization management. With the role mechanism, to grant permissions to a group of users with the same permissions, you only need to grant the permissions to a role and then grant the role to the group of users. You do not need to grant permissions to users one by one. In addition, the separation of roles and permissions can be used to control different permissions of different users and achieve mutual restriction and balance.

With the development of databases and expansion of service scenarios, higher requirements are proposed for database permission separation and fine-grained permission management. The native permission division of PostgreSQL cannot meet diversified service security requirements; therefore, the openGauss database divides permissions at a finer granularity based on the permission models so that users can flexibly assign and manage user permissions based on actual services.

## 2  openGauss Database Permission Levels<a name="section1219765716578"></a>

In the logical structure of the object layout in the openGauss database system, multiple databases can be created under each instance, multiple schemas can be created under each database, and multiple objects can be created under each schema, such as tables, functions, views, and indexes, and each table can be measured by row and column to form the following logical levels:

![](figures/3.png)

The permission system of the openGauss database is constructed based on the preceding logical distribution, as shown in the following figure. Each layer has its own permission control.

![](figures/31.png)

For example, if a user wants to view data in a row of a data table, the user must have the LOGIN permission for logging in to the database, CONNECT permission for connecting to the database where the table is stored, USAGE permission for using the schema of the table, and SELECT permission for viewing the table; in addition, the row level security requirements for the row of data must be met. For details about permission concepts and classification, see the next section.

## 3  Classification of openGauss Database Permissions<a name="section27331525145816"></a>

In the openGauss database, users and roles are basically the same concepts. The only difference is that a role does not have the LOGIN permission by default when being created, and a schema with the same name as the role is not automatically created. That is, a role with the LOGIN permission can be considered as a user. In the following sections, users are used to connect to and access the database and execute SQL statements, and roles are used to organize and manage permissions. Different permissions are packaged into a role and assigned to a user so that the user can obtain all permissions of the role. In addition, after the permissions of a role are changed, the permissions of all members in the role are automatically changed.

In the openGauss database system, permissions are classified into system permissions and object permissions.

-   System permissions refer to the permissions of a user to use a database, such as logging in to a database, creating a database, creating a user or role, and creating a security policy.
-   Object permissions refer to the permissions to perform special operations on database objects, such as databases, schemas, tables, views, and functions. Different objects are associated with different permissions, such as database connection permissions, permissions to view, update, and insert tables, and permissions to execute functions. It is meaningful to describe object permissions based on specific objects.

**3.1 System Permissions**

System permissions are also called user attributes. Users with specific attributes obtain the permissions corresponding to the specified attributes. System permissions cannot be inherited by roles. When creating a user or role, you can run the  **CREATE ROLE/USER**  SQL statement to specify some attributes for the user or role, or run the  **ALTER ROLE/USER**  statement to add or cancel user attributes for the user or role.

The openGauss database supports granting and revoking of the following system permissions:

<a name="table2502454104017"></a>
<table><thead align="left"><tr id="row138461654124013"><th class="cellrowborder" valign="top" width="20.990000000000002%" id="mcps1.1.3.1.1"><p id="p7846185454013"><a name="p7846185454013"></a><a name="p7846185454013"></a><strong id="b148468543405"><a name="b148468543405"></a><a name="b148468543405"></a>System Permission</strong></p>
</th>
<th class="cellrowborder" valign="top" width="79.01%" id="mcps1.1.3.1.2"><p id="p12846554184017"><a name="p12846554184017"></a><a name="p12846554184017"></a><strong id="b17847954184013"><a name="b17847954184013"></a><a name="b17847954184013"></a>Permission Description</strong></p>
</th>
</tr>
</thead>
<tbody><tr id="row284735413409"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p12847185419407"><a name="p12847185419407"></a><a name="p12847185419407"></a>SYSADMIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p15847155416402"><a name="p15847155416402"></a><a name="p15847155416402"></a>Allows users to create databases and tablespaces.</p>
<p id="p8847115412409"><a name="p8847115412409"></a><a name="p8847115412409"></a>Allows users to create users and roles.</p>
<p id="p14847155411409"><a name="p14847155411409"></a><a name="p14847155411409"></a>Allows users to view and delete audit logs.</p>
<p id="p1084716544404"><a name="p1084716544404"></a><a name="p1084716544404"></a>Allows users to view data of other users.</p>
</td>
</tr>
<tr id="row1784719542403"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p78474548404"><a name="p78474548404"></a><a name="p78474548404"></a>MONADMIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p7847155474010"><a name="p7847155474010"></a><a name="p7847155474010"></a>Allows users to view and manage permissions for the dbe_perf schema and monitoring views or functions in this schema.</p>
</td>
</tr>
<tr id="row10847254174019"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p178479548405"><a name="p178479548405"></a><a name="p178479548405"></a>OPRADMIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p8847754124016"><a name="p8847754124016"></a><a name="p8847754124016"></a>Allows users to use Roach to back up and restore databases.</p>
</td>
</tr>
<tr id="row98474548409"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p58475545406"><a name="p58475545406"></a><a name="p58475545406"></a>POLADMIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p17847115494012"><a name="p17847115494012"></a><a name="p17847115494012"></a>Allows users to create resource tags, dynamic data masking policies, and unified audit policies.</p>
</td>
</tr>
<tr id="row1484785414405"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p1984745415405"><a name="p1984745415405"></a><a name="p1984745415405"></a>AUDITADMIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p98471454164013"><a name="p98471454164013"></a><a name="p98471454164013"></a>Allows users to view and delete audit logs.</p>
</td>
</tr>
<tr id="row8847154144018"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p4847145410407"><a name="p4847145410407"></a><a name="p4847145410407"></a>CREATEDB</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p1584765414015"><a name="p1584765414015"></a><a name="p1584765414015"></a>Allows users to create databases.</p>
</td>
</tr>
<tr id="row88472054144010"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p8847175494011"><a name="p8847175494011"></a><a name="p8847175494011"></a>USEFT</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p1284715419405"><a name="p1284715419405"></a><a name="p1284715419405"></a>Allows users to create foreign tables.</p>
</td>
</tr>
<tr id="row15847175454012"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p984755484015"><a name="p984755484015"></a><a name="p984755484015"></a>CREATEROLE</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p2847185413405"><a name="p2847185413405"></a><a name="p2847185413405"></a>Allows users to create users and roles.</p>
</td>
</tr>
<tr id="row78471854134020"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p10847954134015"><a name="p10847954134015"></a><a name="p10847954134015"></a>INHERIT</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p19848175444018"><a name="p19848175444018"></a><a name="p19848175444018"></a>Allows a user to inherit the permissions of the role of the group to which the user belongs.</p>
</td>
</tr>
<tr id="row188481154104013"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p8848654104019"><a name="p8848654104019"></a><a name="p8848654104019"></a>LOGIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p118481454144015"><a name="p118481454144015"></a><a name="p118481454144015"></a>Allow users to log in to the database.</p>
</td>
</tr>
<tr id="row168481454194017"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p15848165416404"><a name="p15848165416404"></a><a name="p15848165416404"></a>REPLICATION</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p18483541402"><a name="p18483541402"></a><a name="p18483541402"></a>Allows users to perform streaming replication operations.</p>
</td>
</tr>
<tr id="row1184819545403"><td class="cellrowborder" valign="top" width="20.990000000000002%" headers="mcps1.1.3.1.1 "><p id="p48481854164010"><a name="p48481854164010"></a><a name="p48481854164010"></a>VCADMIN</p>
</td>
<td class="cellrowborder" valign="top" width="79.01%" headers="mcps1.1.3.1.2 "><p id="p20848854134018"><a name="p20848854134018"></a><a name="p20848854134018"></a>Allows users to create resource pools in associated logical clusters and manage permissions on the associated logical clusters.</p>
</td>
</tr>
</tbody>
</table>

The openGauss provides the CREATE and ALTER ROLE/USER statements to grant and revoke system permissions. The following is an example:

**3.2 Object Permissions**

By default, an object owner has all the operation permissions on the object, such as modifying, deleting, and viewing the object, granting object operation permissions to other users, and revoking granted operation permissions. ALTER, DROP, COMMENT, INDEX, VACUUM, and regrantable permissions for objects are inherent permissions of the owner and are implicitly owned by the owner. Object owners can remove their own common permissions, for example, making tables read-only to themselves or others.

Object permissions can be inherited by roles. In this way, users can package these individual permissions into a role for permission management. The openGauss database supports the following object permissions for each type of database objects:

<a name="table1559354104014"></a>
<table><tbody><tr id="row684865419405"><td class="cellrowborder" valign="top" width="17.608239176082392%"><p id="p11848654144019"><a name="p11848654144019"></a><a name="p11848654144019"></a>Object</p>
</td>
<td class="cellrowborder" valign="top" width="17.778222177782226%"><p id="p148481654154019"><a name="p148481654154019"></a><a name="p148481654154019"></a>Permission</p>
</td>
<td class="cellrowborder" valign="top" width="64.61353864613538%"><p id="p1584816541403"><a name="p1584816541403"></a><a name="p1584816541403"></a>Description</p>
</td>
</tr>
<tr id="row6848105444018"><td class="cellrowborder" rowspan="4" valign="top" width="17.608239176082392%"><p id="p118481542407"><a name="p118481542407"></a><a name="p118481542407"></a>TABLESPACE</p>
</td>
<td class="cellrowborder" valign="top" width="17.778222177782226%"><p id="p1084885444019"><a name="p1084885444019"></a><a name="p1084885444019"></a>CREATE</p>
</td>
<td class="cellrowborder" valign="top" width="64.61353864613538%"><p id="p1284920549404"><a name="p1284920549404"></a><a name="p1284920549404"></a>Allows users to create tables in specified tablespaces.</p>
</td>
</tr>
<tr id="row8849554184018"><td class="cellrowborder" valign="top"><p id="p11849135434013"><a name="p11849135434013"></a><a name="p11849135434013"></a>ALTER</p>
</td>
<td class="cellrowborder" valign="top"><p id="p48491154124015"><a name="p48491154124015"></a><a name="p48491154124015"></a>Allows users to run the <strong id="b11849554184011"><a name="b11849554184011"></a><a name="b11849554184011"></a>ALTER</strong> statement to modify the attributes of a specified tablespace.</p>
</td>
</tr>
<tr id="row78491954174012"><td class="cellrowborder" valign="top"><p id="p984995419408"><a name="p984995419408"></a><a name="p984995419408"></a>DROP</p>
</td>
<td class="cellrowborder" valign="top"><p id="p1284915546406"><a name="p1284915546406"></a><a name="p1284915546406"></a>Allows users to delete specified tablespaces.</p>
</td>
</tr>
<tr id="row1984913541403"><td class="cellrowborder" valign="top"><p id="p384945417407"><a name="p384945417407"></a><a name="p384945417407"></a>COMMENT</p>
</td>
<td class="cellrowborder" valign="top"><p id="p1584918541408"><a name="p1584918541408"></a><a name="p1584918541408"></a>Allows users to define or modify comments for a specified tablespace.</p>
</td>
</tr>
<tr id="row1784911542408"><td class="cellrowborder" rowspan="6" valign="top" width="17.608239176082392%"><p id="p584912548400"><a name="p584912548400"></a><a name="p584912548400"></a>DATABASE</p>
</td>
<td class="cellrowborder" valign="top" width="17.778222177782226%"><p id="p4849175415406"><a name="p4849175415406"></a><a name="p4849175415406"></a>CONNECT</p>
</td>
<td class="cellrowborder" valign="top" width="64.61353864613538%"><p id="p198501054124017"><a name="p198501054124017"></a><a name="p198501054124017"></a>Allows users to connect to a specified database.</p>
</td>
</tr>
<tr id="row1885035414408"><td class="cellrowborder" valign="top"><p id="p4850954114015"><a name="p4850954114015"></a><a name="p4850954114015"></a>TEMP</p>
</td>
<td class="cellrowborder" valign="top"><p id="p16850554184013"><a name="p16850554184013"></a><a name="p16850554184013"></a>Allows users to create temporary tables in a specified database.</p>
</td>
</tr>
<tr id="row685055418404"><td class="cellrowborder" valign="top"><p id="p1585085464016"><a name="p1585085464016"></a><a name="p1585085464016"></a>CREATE</p>
</td>
<td class="cellrowborder" valign="top"><p id="p168507547405"><a name="p168507547405"></a><a name="p168507547405"></a>Allows users to create schemas in a specified database.</p>
</td>
</tr>
<tr id="row13850195415407"><td class="cellrowborder" valign="top"><p id="p785045412409"><a name="p785045412409"></a><a name="p785045412409"></a>ALTER</p>
</td>
<td class="cellrowborder" valign="top"><p id="p6850105419402"><a name="p6850105419402"></a><a name="p6850105419402"></a>Allows users to run the <strong id="b1285035410408"><a name="b1285035410408"></a><a name="b1285035410408"></a>ALTER</strong> statement to modify attributes of a specified database.</p>
</td>
</tr>
<tr id="row1985016547408"><td class="cellrowborder" valign="top"><p id="p48501154134011"><a name="p48501154134011"></a><a name="p48501154134011"></a>DROP</p>
</td>
<td class="cellrowborder" valign="top"><p id="p158501754124011"><a name="p158501754124011"></a><a name="p158501754124011"></a>Allows users to delete a specified database.</p>
</td>
</tr>
<tr id="row5850195494018"><td class="cellrowborder" valign="top"><p id="p178507545402"><a name="p178507545402"></a><a name="p178507545402"></a>COMMENT</p>
</td>
<td class="cellrowborder" valign="top"><p id="p208501554114010"><a name="p208501554114010"></a><a name="p208501554114010"></a>Allows users to define or modify comments for a specified database.</p>
</td>
</tr>
<tr id="row5850175444010"><td class="cellrowborder" rowspan="5" valign="top" width="17.608239176082392%"><p id="p18501854114014"><a name="p18501854114014"></a><a name="p18501854114014"></a>SCHEMA</p>
</td>
<td class="cellrowborder" valign="top" width="17.778222177782226%"><p id="p148501454114018"><a name="p148501454114018"></a><a name="p148501454114018"></a>CREATE</p>
</td>
<td class="cellrowborder" valign="top" width="64.61353864613538%"><p id="p158501154194016"><a name="p158501154194016"></a><a name="p158501154194016"></a>Allows users to create new objects in a specified schema.</p>
</td>
</tr>
<tr id="row1885005410405"><td class="cellrowborder" valign="top"><p id="p1850195414402"><a name="p1850195414402"></a><a name="p1850195414402"></a>USAGE</p>
</td>
<td class="cellrowborder" valign="top"><p id="p68509540401"><a name="p68509540401"></a><a name="p68509540401"></a>Allows users to access objects contained in a specified schema.</p>
</td>
</tr>
<tr id="row98509540405"><td class="cellrowborder" valign="top"><p id="p17850354184017"><a name="p17850354184017"></a><a name="p17850354184017"></a>ALTER</p>
</td>
<td class="cellrowborder" valign="top"><p id="p685085414400"><a name="p685085414400"></a><a name="p685085414400"></a>Allows users to run the <strong id="b15850454194017"><a name="b15850454194017"></a><a name="b15850454194017"></a>ALTER</strong> statement to modify attributes of a specified schema.</p>
</td>
</tr>
<tr id="row1285111547404"><td class="cellrowborder" valign="top"><p id="p17851115411405"><a name="p17851115411405"></a><a name="p17851115411405"></a>DROP</p>
</td>
<td class="cellrowborder" valign="top"><p id="p17851454174016"><a name="p17851454174016"></a><a name="p17851454174016"></a>Allows users to delete a specified schema.</p>
</td>
</tr>
<tr id="row585118548401"><td class="cellrowborder" valign="top"><p id="p985165414017"><a name="p985165414017"></a><a name="p985165414017"></a>COMMENT</p>
</td>
<td class="cellrowborder" valign="top"><p id="p1785125464015"><a name="p1785125464015"></a><a name="p1785125464015"></a>Allows users to define or modify comments for a specified schema.</p>
</td>
</tr>
<tr id="row148511154104013"><td class="cellrowborder" rowspan="4" valign="top" width="17.608239176082392%"><p id="p198511354154015"><a name="p198511354154015"></a><a name="p198511354154015"></a>FUNCTION</p>
</td>
<td class="cellrowborder" valign="top" width="17.778222177782226%"><p id="p185185414401"><a name="p185185414401"></a><a name="p185185414401"></a>EXECUTE</p>
</td>
<td class="cellrowborder" valign="top" width="64.61353864613538%"><p id="p138513547407"><a name="p138513547407"></a><a name="p138513547407"></a>Allows users to use a specified function.</p>
</td>
</tr>
<tr id="row10851154194019"><td class="cellrowborder" valign="top"><p id="p14851154154018"><a name="p14851154154018"></a><a name="p14851154154018"></a>ALTER</p>
</td>
<td class="cellrowborder" valign="top"><p id="p8851654104011"><a name="p8851654104011"></a><a name="p8851654104011"></a>Allows users to run the <strong id="b20851105415403"><a name="b20851105415403"></a><a name="b20851105415403"></a>ALTER</strong> statement to modify attributes of a specified function.</p>
</td>
</tr>
<tr id="row16851195418403"><td class="cellrowborder" valign="top"><p id="p9851354144012"><a name="p9851354144012"></a><a name="p9851354144012"></a>DROP</p>
</td>
<td class="cellrowborder" valign="top"><p id="p12851115419409"><a name="p12851115419409"></a><a name="p12851115419409"></a>Allows users to delete a specified function.</p>
</td>
</tr>
<tr id="row14851105444016"><td class="cellrowborder" valign="top"><p id="p385155484018"><a name="p385155484018"></a><a name="p385155484018"></a>COMMENT</p>
</td>
<td class="cellrowborder" valign="top"><p id="p14851165454010"><a name="p14851165454010"></a><a name="p14851165454010"></a>Allows users to define or modify comments for a specified function.</p>
</td>
</tr>
<tr id="row19851175444017"><td class="cellrowborder" rowspan="12" valign="top" width="17.608239176082392%"><p id="p1985125474011"><a name="p1985125474011"></a><a name="p1985125474011"></a>TABLE</p>
</td>
<td class="cellrowborder" valign="top" width="17.778222177782226%"><p id="p10851115484012"><a name="p10851115484012"></a><a name="p10851115484012"></a>INSERT</p>
</td>
<td class="cellrowborder" valign="top" width="64.61353864613538%"><p id="p48511541409"><a name="p48511541409"></a><a name="p48511541409"></a>Allows users to run the INSERT statement to insert data into a specified table.</p>
</td>
</tr>
<tr id="row198512545400"><td class="cellrowborder" valign="top"><p id="p78515541405"><a name="p78515541405"></a><a name="p78515541405"></a>DELETE</p>
</td>
<td class="cellrowborder" valign="top"><p id="p1885114543406"><a name="p1885114543406"></a><a name="p1885114543406"></a>Allows users to run the <strong id="b118517549407"><a name="b118517549407"></a><a name="b118517549407"></a>DELETE</strong> statement to delete data from a specified table.</p>
</td>
</tr>
<tr id="row17852554194014"><td class="cellrowborder" valign="top"><p id="p20852145444018"><a name="p20852145444018"></a><a name="p20852145444018"></a>UPDATE</p>
</td>
<td class="cellrowborder" valign="top"><p id="p685215404016"><a name="p685215404016"></a><a name="p685215404016"></a>Allows users to run the <strong id="b2085210544403"><a name="b2085210544403"></a><a name="b2085210544403"></a>UPDATE</strong> statement on a specified table.</p>
</td>
</tr>
<tr id="row18852454144015"><td class="cellrowborder" valign="top"><p id="p985211541404"><a name="p985211541404"></a><a name="p985211541404"></a>SELECT</p>
</td>
<td class="cellrowborder" valign="top"><p id="p1085210543408"><a name="p1085210543408"></a><a name="p1085210543408"></a>Allows users to run the <strong id="b38521054164010"><a name="b38521054164010"></a><a name="b38521054164010"></a>SELECT</strong> statement on a specified table.</p>
</td>
</tr>
<tr id="row38524545403"><td class="cellrowborder" valign="top"><p id="p128521054164010"><a name="p128521054164010"></a><a name="p128521054164010"></a>TRUNCATE</p>
</td>
<td class="cellrowborder" valign="top"><p id="p485245417406"><a name="p485245417406"></a><a name="p485245417406"></a>Allows users to run the <strong id="b585218541401"><a name="b585218541401"></a><a name="b585218541401"></a>TRUNCATE</strong> statement on a specified table.</p>
</td>
</tr>
<tr id="row138521354114014"><td class="cellrowborder" valign="top"><p id="p16852185474012"><a name="p16852185474012"></a><a name="p16852185474012"></a>REFERENCES</p>
</td>
<td class="cellrowborder" valign="top"><p id="p38521154144015"><a name="p38521154144015"></a><a name="p38521154144015"></a>Allows users to create a foreign key constraint on a specified table.</p>
</td>
</tr>
<tr id="row148521454104011"><td class="cellrowborder" valign="top"><p id="p13852175419400"><a name="p13852175419400"></a><a name="p13852175419400"></a>TRIGGER</p>
</td>
<td class="cellrowborder" valign="top"><p id="p10852354104017"><a name="p10852354104017"></a><a name="p10852354104017"></a>Allows users to create a trigger on a specified table.</p>
</td>
</tr>
<tr id="row108521754204012"><td class="cellrowborder" valign="top"><p id="p88520543409"><a name="p88520543409"></a><a name="p88520543409"></a>ALTER</p>
</td>
<td class="cellrowborder" valign="top"><p id="p11852115404017"><a name="p11852115404017"></a><a name="p11852115404017"></a>Allows users to run the <strong id="b10852165418407"><a name="b10852165418407"></a><a name="b10852165418407"></a>ALTER</strong> statement to modify attributes of a specified table.</p>
</td>
</tr>
<tr id="row985215420406"><td class="cellrowborder" valign="top"><p id="p7852195419404"><a name="p7852195419404"></a><a name="p7852195419404"></a>DROP</p>
</td>
<td class="cellrowborder" valign="top"><p id="p4852195464014"><a name="p4852195464014"></a><a name="p4852195464014"></a>Allows users to delete a specified table.</p>
</td>
</tr>
<tr id="row1285215414011"><td class="cellrowborder" valign="top"><p id="p6852175464015"><a name="p6852175464015"></a><a name="p6852175464015"></a>COMMENT</p>
</td>
<td class="cellrowborder" valign="top"><p id="p13852254184019"><a name="p13852254184019"></a><a name="p13852254184019"></a>Allows users to define or modify comments for a specified table.</p>
</td>
</tr>
<tr id="row17852205424010"><td class="cellrowborder" valign="top"><p id="p11852195410401"><a name="p11852195410401"></a><a name="p11852195410401"></a>INDEX</p>
</td>
<td class="cellrowborder" valign="top"><p id="p17853354204019"><a name="p17853354204019"></a><a name="p17853354204019"></a>Allows users to create indexes on a specified table and manage the indexes on the specified table.</p>
</td>
</tr>
<tr id="row38531454104017"><td class="cellrowborder" valign="top"><p id="p10853145494014"><a name="p10853145494014"></a><a name="p10853145494014"></a>VACUUM</p>
</td>
<td class="cellrowborder" valign="top"><p id="p1285335416401"><a name="p1285335416401"></a><a name="p1285335416401"></a>Allows users to perform ANALYZE and VACUUM operations on a specified table.</p>
</td>
</tr>
</tbody>
</table>

openGauss provides the GRANT and REVOKE statements to grant and revoke object permissions.

**3.3 User Permission Set**

According to the permission management mechanism of the openGauss database, a user has the union of the following types of permissions:

![](figures/32.png)

In actual service applications, you are advised to configure accounts based on the least privilege principle and assign the minimum permissions to users on the basis that service requirements are met.

## 4 openGauss Database Permission Evolution<a name="section4406650105811"></a>

The openGauss database provides a series of system permissions and object permissions. You can combine permissions into roles based on actual services. However, with the feedback from users in various application scenarios, the openGauss database will provide a series of built-in roles in the future. The permissions that are frequently used in actual applications are packaged into built-in roles. Users can directly use the built-in roles to manage permissions.

