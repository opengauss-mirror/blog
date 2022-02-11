+++

title = "Segment-Page Feature of openGauss for Solving File Storage Problems"

date = "2021-10-20"

tags = [ "Segment-Page Feature of openGauss for Solving File Storage Problems"]

archives = "2021-10"

author = "Peng Bao "

summary = "Segment-Page Feature of openGauss for Solving File Storage Problems"

img = "/en/post/2022/title/img16.png"

times = "12:30"

+++

# Segment-Page Feature of openGauss for Solving File Storage Problems<a name="ZH-CN_TOPIC_0000001206626670"></a>

In modern society, data is growing explosively, and service requirements in the industry are complex. The amount of data to be stored and the number of tables to be created keep increasing. Each common data table of openGauss corresponds to a logical large file \(maximum size: 32 TB\). The logical file is divided into multiple actual files based on the fixed size and stored in the corresponding database directory. Therefore, as the data volume of each data table increases, the number of files required for underlying data storage increases gradually. In addition, openGauss provides features such as hash bucket tables and large partitioned tables. Each data table is split into several sub-tables, and the number of files required at the bottom layer increases exponentially. Therefore, this storage management mode has the following problems:

-   1. It depends greatly on the file system and cannot perform fine-grained control to improve maintainability.
-   2. There are too many file handles in the case of a large amount of data. Currently, only virtual handles can be used to solve the problem, which affects the system performance.
-   3. Too many small files may cause random I/O problems in scenarios such as full build and full backup, affecting performance.

To resolve the foregoing problems, openGauss introduces a segment-page storage management mechanism, which is similar to segment-page memory management of an operating system, but differs greatly in implementation mechanisms.

## Implementation Principle of the Segment-Page Mechanism<a name="section715502410562"></a>

With the segment-page storage management, tablespaces and data files are logically organized into segments, extents, and pages/blocks for storage allocation and management, as shown in the following figure. Specifically, a database \(in a tablespace\) has only one segment space. The actual physical storage may be a file or may be split into multiple files. Data is allocated to all tables in the database from this space. Therefore, the number of tables is irrelevant to the number of physical files. Each table has a logical segment, and all data in the table is stored in the segment. Multiple extents are mounted to each segment. Each extent is a continuous physical page. Extent sizes can be flexibly adjusted based on service requirements to avoid storage space waste.

![](figures/zh-cn_image_0000001207699778.jpg)

Figure 1 Segment-page storage design

Segment-page files can be automatically expanded until the disk space is used up or the limit threshold for the tablespace is reached. Segment-page storage does not automatically reclaim disk space. After some data tables are deleted, the space occupied by the data tables in the segment-page file is reserved and the disk space is not released. These reserved spaces will be reused by tables that are expanded or created later. If you do not need to reuse the space, you can manually call system functions to recycle and then release disk space.

In internal implementation, each segment corresponds to a physical file that is originally stored in page mode. For example, each partitioned table and a bucket in each hash bucket table have an independent segment. Multiple extents are mounted to each segment. Each extent is consecutive in a file, but extents may not be consecutive between each other. A segment can be dynamically expanded by adding new extents, but an extent cannot be directly reclaimed. You can reclaim storage space by segment by truncating or clustering the entire table.

Currently, four sizes of extents are supported: 64 KB, 1 MB, 8 MB, and 64 MB. For a segment, the size of the extent expanded each time is fixed. The size of the first 16 extents is 64 KB, the size of the 17th to 143th extents is 1 MB. The same rule applies to other extents. The following figure lists the parameters.

Table 1 Classification of extents stored in a segment

<a name="table125348919526"></a>
<table><thead align="left"><tr id="row11837109105215"><th class="cellrowborder" valign="top" width="10.141014101410141%" id="mcps1.1.7.1.1"><p id="p48376995217"><a name="p48376995217"></a><a name="p48376995217"></a>Group</p>
</th>
<th class="cellrowborder" valign="top" width="15.4015401540154%" id="mcps1.1.7.1.2"><p id="p1983719915529"><a name="p1983719915529"></a><a name="p1983719915529"></a>Extent Size</p>
</th>
<th class="cellrowborder" valign="top" width="20.47204720472047%" id="mcps1.1.7.1.3"><p id="p138461693523"><a name="p138461693523"></a><a name="p138461693523"></a>Extent Page Count</p>
</th>
<th class="cellrowborder" valign="top" width="22.28222822282228%" id="mcps1.1.7.1.4"><p id="p58469920521"><a name="p58469920521"></a><a name="p58469920521"></a>Extent Count Range</p>
</th>
<th class="cellrowborder" valign="top" width="18.84188418841884%" id="mcps1.1.7.1.5"><p id="p28460910527"><a name="p28460910527"></a><a name="p28460910527"></a>Total Page Count</p>
</th>
<th class="cellrowborder" valign="top" width="12.861286128612862%" id="mcps1.1.7.1.6"><p id="p178461896522"><a name="p178461896522"></a><a name="p178461896522"></a>Total Size</p>
</th>
</tr>
</thead>
<tbody><tr id="row1484617955219"><td class="cellrowborder" valign="top" width="10.141014101410141%" headers="mcps1.1.7.1.1 "><p id="p1584620975219"><a name="p1584620975219"></a><a name="p1584620975219"></a>1</p>
</td>
<td class="cellrowborder" valign="top" width="15.4015401540154%" headers="mcps1.1.7.1.2 "><p id="p108460915219"><a name="p108460915219"></a><a name="p108460915219"></a>64 KB</p>
</td>
<td class="cellrowborder" valign="top" width="20.47204720472047%" headers="mcps1.1.7.1.3 "><p id="p208466925214"><a name="p208466925214"></a><a name="p208466925214"></a>8</p>
</td>
<td class="cellrowborder" valign="top" width="22.28222822282228%" headers="mcps1.1.7.1.4 "><p id="p284616965210"><a name="p284616965210"></a><a name="p284616965210"></a>[1, 16]</p>
</td>
<td class="cellrowborder" valign="top" width="18.84188418841884%" headers="mcps1.1.7.1.5 "><p id="p12846491526"><a name="p12846491526"></a><a name="p12846491526"></a>128</p>
</td>
<td class="cellrowborder" valign="top" width="12.861286128612862%" headers="mcps1.1.7.1.6 "><p id="p17846129105211"><a name="p17846129105211"></a><a name="p17846129105211"></a>1 MB</p>
</td>
</tr>
<tr id="row148466919525"><td class="cellrowborder" valign="top" width="10.141014101410141%" headers="mcps1.1.7.1.1 "><p id="p1484619913522"><a name="p1484619913522"></a><a name="p1484619913522"></a>2</p>
</td>
<td class="cellrowborder" valign="top" width="15.4015401540154%" headers="mcps1.1.7.1.2 "><p id="p884718995215"><a name="p884718995215"></a><a name="p884718995215"></a>1 MB</p>
</td>
<td class="cellrowborder" valign="top" width="20.47204720472047%" headers="mcps1.1.7.1.3 "><p id="p684779195217"><a name="p684779195217"></a><a name="p684779195217"></a>128</p>
</td>
<td class="cellrowborder" valign="top" width="22.28222822282228%" headers="mcps1.1.7.1.4 "><p id="p158473995218"><a name="p158473995218"></a><a name="p158473995218"></a>[17, 143]</p>
</td>
<td class="cellrowborder" valign="top" width="18.84188418841884%" headers="mcps1.1.7.1.5 "><p id="p38475925211"><a name="p38475925211"></a><a name="p38475925211"></a>16K</p>
</td>
<td class="cellrowborder" valign="top" width="12.861286128612862%" headers="mcps1.1.7.1.6 "><p id="p138471996526"><a name="p138471996526"></a><a name="p138471996526"></a>128 MB</p>
</td>
</tr>
<tr id="row684759205219"><td class="cellrowborder" valign="top" width="10.141014101410141%" headers="mcps1.1.7.1.1 "><p id="p18847189155215"><a name="p18847189155215"></a><a name="p18847189155215"></a>3</p>
</td>
<td class="cellrowborder" valign="top" width="15.4015401540154%" headers="mcps1.1.7.1.2 "><p id="p6847793526"><a name="p6847793526"></a><a name="p6847793526"></a>8 MB</p>
</td>
<td class="cellrowborder" valign="top" width="20.47204720472047%" headers="mcps1.1.7.1.3 "><p id="p3847796526"><a name="p3847796526"></a><a name="p3847796526"></a>1024</p>
</td>
<td class="cellrowborder" valign="top" width="22.28222822282228%" headers="mcps1.1.7.1.4 "><p id="p1384710914521"><a name="p1384710914521"></a><a name="p1384710914521"></a>[144, 255]</p>
</td>
<td class="cellrowborder" valign="top" width="18.84188418841884%" headers="mcps1.1.7.1.5 "><p id="p7847999529"><a name="p7847999529"></a><a name="p7847999529"></a>128K</p>
</td>
<td class="cellrowborder" valign="top" width="12.861286128612862%" headers="mcps1.1.7.1.6 "><p id="p684717916524"><a name="p684717916524"></a><a name="p684717916524"></a>1 GB</p>
</td>
</tr>
<tr id="row1384799115213"><td class="cellrowborder" valign="top" width="10.141014101410141%" headers="mcps1.1.7.1.1 "><p id="p684711985211"><a name="p684711985211"></a><a name="p684711985211"></a>4</p>
</td>
<td class="cellrowborder" valign="top" width="15.4015401540154%" headers="mcps1.1.7.1.2 "><p id="p1847398527"><a name="p1847398527"></a><a name="p1847398527"></a>64 MB</p>
</td>
<td class="cellrowborder" valign="top" width="20.47204720472047%" headers="mcps1.1.7.1.3 "><p id="p1784710911529"><a name="p1784710911529"></a><a name="p1784710911529"></a>8192</p>
</td>
<td class="cellrowborder" valign="top" width="22.28222822282228%" headers="mcps1.1.7.1.4 "><p id="p1384749115215"><a name="p1384749115215"></a><a name="p1384749115215"></a>[256, …]</p>
</td>
<td class="cellrowborder" valign="top" width="18.84188418841884%" headers="mcps1.1.7.1.5 "><p id="p2847891524"><a name="p2847891524"></a><a name="p2847891524"></a>...</p>
</td>
<td class="cellrowborder" valign="top" width="12.861286128612862%" headers="mcps1.1.7.1.6 "><p id="p184712985219"><a name="p184712985219"></a><a name="p184712985219"></a>...</p>
</td>
</tr>
</tbody>
</table>

## Guide to Using Segment-Page Tables<a name="section667921411583"></a>

When using the CREATE TABLE statement to create a table, you can specify  **segment=on**  to enable a row-store table to store data in segment-page mode. If  **hashbucket=on**  is specified,  **segment=on**  is forcibly used by default. Currently, segment-page storage does not support column-store tables. Segment-page tablespaces are automatically created and do not require additional commands.

-   Set  **segment**  to  **on**  to create a segment-page common table.

    create table t1\(a int, b int, PRIMARY KEY\(a,b\)\) with\(segment=on\);

    ![](figures/zh-cn_image_0000001207539820.jpg)

-   Set  **hashbucket**  to  **on**  to create a segment-page hash bucket table.

    create table t1\(a int, b int, PRIMARY KEY\(a,b\)\) with\(hashbucket=on\);

    ![](figures/zh-cn_image_0000001252579733.jpg)

    To help users better use the segment-page storage function, openGauss provides two built-in system functions to display the extent usage. Users can use the two views to determine whether to reclaim data and which part of the data to be reclaimed.

-   **pg\_stat\_segment\_space\_info\(Oid tablespace, Oid database\);**specifies the OIDs of the tablespace and database to display the usage information about all extent groups in the tablespace.

    Table 2 pg\_stat\_segment\_space\_info view column information

    <a name="table145904915216"></a>
    <table><thead align="left"><tr id="row1849139195216"><th class="cellrowborder" valign="top" width="40.67%" id="mcps1.1.3.1.1"><p id="p12849179155213"><a name="p12849179155213"></a><a name="p12849179155213"></a><strong id="b108498911525"><a name="b108498911525"></a><a name="b108498911525"></a>Name</strong></p>
    </th>
    <th class="cellrowborder" valign="top" width="59.330000000000005%" id="mcps1.1.3.1.2"><p id="p168491699525"><a name="p168491699525"></a><a name="p168491699525"></a><strong id="b98494913528"><a name="b98494913528"></a><a name="b98494913528"></a>Description</strong></p>
    </th>
    </tr>
    </thead>
    <tbody><tr id="row13849793529"><td class="cellrowborder" valign="top" width="40.67%" headers="mcps1.1.3.1.1 "><p id="p184912985217"><a name="p184912985217"></a><a name="p184912985217"></a>extent_size</p>
    </td>
    <td class="cellrowborder" valign="top" width="59.330000000000005%" headers="mcps1.1.3.1.2 "><p id="p178495913524"><a name="p178495913524"></a><a name="p178495913524"></a>Extent specifications of an extent group. The unit is the number of blocks.</p>
    </td>
    </tr>
    <tr id="row118496912522"><td class="cellrowborder" valign="top" width="40.67%" headers="mcps1.1.3.1.1 "><p id="p1084929135217"><a name="p1084929135217"></a><a name="p1084929135217"></a>total_blocks</p>
    </td>
    <td class="cellrowborder" valign="top" width="59.330000000000005%" headers="mcps1.1.3.1.2 "><p id="p1684910916528"><a name="p1684910916528"></a><a name="p1684910916528"></a>Total number of extents in a physical file</p>
    </td>
    </tr>
    <tr id="row108491298522"><td class="cellrowborder" valign="top" width="40.67%" headers="mcps1.1.3.1.1 "><p id="p4849497529"><a name="p4849497529"></a><a name="p4849497529"></a>meta_data_blocks</p>
    </td>
    <td class="cellrowborder" valign="top" width="59.330000000000005%" headers="mcps1.1.3.1.2 "><p id="p1284911975217"><a name="p1284911975217"></a><a name="p1284911975217"></a>Number of blocks occupied by the metadata managed in a tablespace, including the space header and map page but excluding the segment head</p>
    </td>
    </tr>
    <tr id="row138491945211"><td class="cellrowborder" valign="top" width="40.67%" headers="mcps1.1.3.1.1 "><p id="p1684919914528"><a name="p1684919914528"></a><a name="p1684919914528"></a>used_data_blocks</p>
    </td>
    <td class="cellrowborder" valign="top" width="59.330000000000005%" headers="mcps1.1.3.1.2 "><p id="p1384969135214"><a name="p1384969135214"></a><a name="p1384969135214"></a>Number of extents used for storing data, including the segment head</p>
    </td>
    </tr>
    <tr id="row158493915526"><td class="cellrowborder" valign="top" width="40.67%" headers="mcps1.1.3.1.1 "><p id="p188501199527"><a name="p188501199527"></a><a name="p188501199527"></a>utilization</p>
    </td>
    <td class="cellrowborder" valign="top" width="59.330000000000005%" headers="mcps1.1.3.1.2 "><p id="p178507912526"><a name="p178507912526"></a><a name="p178507912526"></a>Percentage of the number of used blocks to the total number of blocks, that is, (the value of <strong id="b785019165216"><a name="b785019165216"></a><a name="b785019165216"></a>used_data_blocks</strong> + the value of <strong id="b118509913522"><a name="b118509913522"></a><a name="b118509913522"></a>meta_data_block</strong>)/the value of <strong id="b88502955218"><a name="b88502955218"></a><a name="b88502955218"></a>total_blocks</strong></p>
    </td>
    </tr>
    <tr id="row12850198520"><td class="cellrowborder" valign="top" width="40.67%" headers="mcps1.1.3.1.1 "><p id="p108508917524"><a name="p108508917524"></a><a name="p108508917524"></a>high_water_mark</p>
    </td>
    <td class="cellrowborder" valign="top" width="59.330000000000005%" headers="mcps1.1.3.1.2 "><p id="p1785013955219"><a name="p1785013955219"></a><a name="p1785013955219"></a>High-water mark, indicating the number of allocated extents and maximum physical page number. Blocks that exceed the high-water mark are not used and can be directly recycled.</p>
    </td>
    </tr>
    </tbody>
    </table>

    ![](figures/zh-cn_image_0000001207699780.jpg)


-   **pg\_stat\_segment\_extent\_usage\(Oid tablespace, Oid databse, uint32 extent\_type\);**specifies the usage information of each allocated extent in an extent group returned each time.**extent\_type**  indicates the type of the extent group. The value is an integer ranging from 1 to 5.If the value is not within the range, an error is reported.

    Table 3 pg\_stat\_segment\_extent\_usage view column information

    <a name="table760489155218"></a>
    <table><thead align="left"><tr id="row16850497529"><th class="cellrowborder" valign="top" width="39.32%" id="mcps1.1.3.1.1"><p id="p11851179115215"><a name="p11851179115215"></a><a name="p11851179115215"></a><strong id="b68517917523"><a name="b68517917523"></a><a name="b68517917523"></a>Name</strong></p>
    </th>
    <th class="cellrowborder" valign="top" width="60.68%" id="mcps1.1.3.1.2"><p id="p16851996520"><a name="p16851996520"></a><a name="p16851996520"></a><strong id="b198519912529"><a name="b198519912529"></a><a name="b198519912529"></a>Description</strong></p>
    </th>
    </tr>
    </thead>
    <tbody><tr id="row108518925215"><td class="cellrowborder" valign="top" width="39.32%" headers="mcps1.1.3.1.1 "><p id="p168511097526"><a name="p168511097526"></a><a name="p168511097526"></a>start_block</p>
    </td>
    <td class="cellrowborder" valign="top" width="60.68%" headers="mcps1.1.3.1.2 "><p id="p485120917526"><a name="p485120917526"></a><a name="p485120917526"></a>Start physical page number of an extent</p>
    </td>
    </tr>
    <tr id="row12851490524"><td class="cellrowborder" valign="top" width="39.32%" headers="mcps1.1.3.1.1 "><p id="p785117920528"><a name="p785117920528"></a><a name="p785117920528"></a>extent_size</p>
    </td>
    <td class="cellrowborder" valign="top" width="60.68%" headers="mcps1.1.3.1.2 "><p id="p68516911525"><a name="p68516911525"></a><a name="p68516911525"></a>Extent size</p>
    </td>
    </tr>
    <tr id="row18851159195219"><td class="cellrowborder" valign="top" width="39.32%" headers="mcps1.1.3.1.1 "><p id="p1385117905218"><a name="p1385117905218"></a><a name="p1385117905218"></a>usage_type</p>
    </td>
    <td class="cellrowborder" valign="top" width="60.68%" headers="mcps1.1.3.1.2 "><p id="p1585115914526"><a name="p1585115914526"></a><a name="p1585115914526"></a>Usage type of an extent, for example, <strong id="b1485179135214"><a name="b1485179135214"></a><a name="b1485179135214"></a>segment head</strong> and <strong id="b1885111975212"><a name="b1885111975212"></a><a name="b1885111975212"></a>data extent</strong></p>
    </td>
    </tr>
    <tr id="row08515919523"><td class="cellrowborder" valign="top" width="39.32%" headers="mcps1.1.3.1.1 "><p id="p885115925217"><a name="p885115925217"></a><a name="p885115925217"></a>ower_location</p>
    </td>
    <td class="cellrowborder" valign="top" width="60.68%" headers="mcps1.1.3.1.2 "><p id="p1985114905219"><a name="p1985114905219"></a><a name="p1985114905219"></a>Object location of an extent to which a pointer points. For example, the owner of a data extent is the head of the segment to which the data extent belongs.</p>
    </td>
    </tr>
    <tr id="row18851395521"><td class="cellrowborder" valign="top" width="39.32%" headers="mcps1.1.3.1.1 "><p id="p148511291527"><a name="p148511291527"></a><a name="p148511291527"></a>special_data</p>
    </td>
    <td class="cellrowborder" valign="top" width="60.68%" headers="mcps1.1.3.1.2 "><p id="p985218911527"><a name="p985218911527"></a><a name="p985218911527"></a>Position of an extent in its owner. The value of this column is related to the usage type. For example, special data of a data extent is the extent ID in the segment to which the data extent belongs.</p>
    </td>
    </tr>
    </tbody>
    </table>


-   **gs\_spc\_shrink\(Oid tablespace, Oid database, uint32 extent\_type\);**specifies that one extent group is cleared at a time. The target size in shrinking is automatically calculated as follows: Active data volume + 128 MB. The value is rounded up and aligned with 128 MB.

## Summary<a name="section960764175812"></a>

openGauss provides the segment-page solution to solve the problem that there are too many underlying file handles when there are a large number of hash bucket tables and large partitioned tables. In the segment-page solution, a table corresponds to a logical segment. Different segments at the bottom layer are stored in a physical file, greatly reducing the number of handles of the physical file at the bottom layer. Even in the case of a large amount of data, the scenario where there are too many file handles such as common tables is avoided, and the system maintainability is improved. In addition, in scenarios such as full build and full backup, random I/Os caused by too many small files can be reduced to improve system I/O performance. The parameters related to the current segment-page table are fixed. In the future, openGauss can use the AI technology to automatically adjust parameters for the segment-page storage mechanism, providing users with more intelligent and better-performance segment-page storage policies.

