+++

title = "Basic Use of the Fully-encrypted Database"

date = "2021-10-16"

tags = [ "Basic Use of the Fully-encrypted Database"]

archives = "2021-10"

author = "Jinxiang Xiao"

summary = "Basic Use of the Fully-encrypted Database"

img = "/en/post/2022/title/img10.png"

times = "12:30"

+++

# Basic Use of the Fully-encrypted Database<a name="ZH-CN_TOPIC_0000001206466692"></a>

## 1. Introduction to the Fully-encrypted Database Features<a name="section8601058114019"></a>

A fully-encrypted database aims to protect privacy throughout the data lifecycle. Data is always encrypted during transmission, computing, and storage regardless of the service scenario or environment. After the data owner encrypts data on the client and sends the encrypted data to the server, even if an attacker manages to exploit some system vulnerability and steal user data, they cannot obtain valuable information. Data privacy is protected.

## 2. Customer Benefits of the Fully-encrypted Database<a name="section4346967417"></a>

The entire service data flow is encrypted during processing. A fully-encrypted database:

1.  Protects data privacy and security throughout the lifecycle on the cloud. Attackers cannot obtain information from the database server regardless of the data status.
2.  Helps cloud service providers earn the trust of third-party users. Users, including service administrators and O&M administrators in enterprise service scenarios and application developers in consumer cloud services, can keep the encryption keys themselves so that even users with high permissions cannot access unencrypted data.
3.  Enables cloud databases to better comply with personal privacy protection laws and regulations.

## 3. Use of the Fully-encrypted Database<a name="section9624618154118"></a>

Currently, the fully-encrypted database supports two connection modes: gsql and JDBC. This chapter describes how to use the database in the two connection modes.

### 3.1 Connecting to a Fully-encrypted Database

1. Run the  **gsql -p PORT –d postgres -r –C**  command to enable the encryption function.

Parameter description:

**-p**  indicates the port number.  **-d**  indicates the database name.  **-C**  indicates that the encryption function is enabled.

2. To support JDBC operations on a fully-encrypted database, set  **enable\_ce**  to  **1**.

### 3.2 Creating a User Key

A fully-encrypted database has two types of keys: client master key \(CMK\) and data encryption key \(CEK\).

The CMK is used to encrypt the CEK. The CEK is used to encrypt user data.

Before creating a key, use gs\_ktool to create a key ID for creating a CMK.

openGauss=\#  **\\! gs\_ktool -g**

The sequence and dependency of creating a key are as follows: creating a key ID \> creating a CMK \> creating a CEK.

-   **1. Creating a CMK and a CEK in the GSQL Environment**
    
-    [Creating a CMK\]

    CREATE CLIENT MASTER KEY client\_master\_key\_name WITH \(KEY\_STORE = key\_store\_name, KEY\_PATH = "key\_path\_value", ALGORITHM = algorithm\_type\);

    Parameter description:

    -   client\_master\_key\_name

    This parameter is used as the name of a key object. In the same namespace, the value of this parameter must be unique.

    Value range: a string. It must comply with the naming convention.

    -   KEY\_STORE

    Tool or service that independently manages keys. Currently, only the key management tool gs\_ktool provided by GaussDB Kenel and the online key management service huawei\_kms provided by Huawei Cloud are supported. Value range:  **gs\_ktool**  and  **huawei\_kms**

    -   KEY\_PATH

    A key in the key management tool or service. The  **KEY\_STORE**  and  **KEY\_PATH**  parameters can be used to uniquely identify a key entity. When  **KEY\_STORE**  is set to  **gs\_ktool**, the value is  **gs\_ktool**  or  **KEY\_ID**. When  **KEY\_STORE**  is set to  **huawei\_kms**, the value is a 36-byte key ID.

    -   ALGORITHM

    This parameter specifies the encryption algorithm used by the key entity. When  **KEY\_STORE**  is set to  **gs\_ktool**, the value can be  **AES\_256\_CBC**  or  **SM4**. When  **KEY\_STORE**  is set to  **huawei\_kms**, the value is  **AES\_256**.

- \[Creating a CEK\]

  CREATE COLUMN ENCRYPTION KEY column\_encryption\_key\_name WITH\(CLIENT\_MASTER\_KEY = client\_master\_key\_name, ALGORITHM = algorithm\_type, ENCRYPTED\_VALUE = encrypted\_value\);

  Parameter description:

  -   column\_encryption\_key\_name

  This parameter is used as the name of a key object. In the same namespace, the value of this parameter must be unique.

  Value range: String, which must comply with the naming convention.

  -   CLIENT\_MASTER\_KEY

  Specifies the CMK used to encrypt the CEK. The value is the CMK object name, which is created using the  **CREATE CLIENT MASTER KEY**  syntax.

  -   ALGORITHM

  Encryption algorithm to be used by the CEK. The value can be  **AEAD\_AES\_256\_CBC\_HMAC\_SHA256**,  **AEAD\_AES\_128\_CBC\_HMAC\_SHA256**, or  **SM4\_SM3**.

  -   **ENCRYPTED\_VALUE \(optional\)**

  A key password specified by a user. The key password length ranges from 28 to 256 bits. The derived 28-bit key meets the AES128 security requirements. If the user needs to use AES256, the key password length must be 39 bits. If the user does not specify the key password length, a 256-bit key is automatically generated.

  \[Example in the GSQL environment\]

  <a name="table91781384390"></a>
  <table><tbody><tr id="row1788812919394"><td class="cellrowborder" valign="top" width="6.69%"><p id="p588811916399"><a name="p588811916399"></a><a name="p588811916399"></a><strong id="b188881923912"><a name="b188881923912"></a><a name="b188881923912"></a>1</strong></p>
  <p id="p388959183914"><a name="p388959183914"></a><a name="p388959183914"></a><strong id="b118897963914"><a name="b118897963914"></a><a name="b118897963914"></a>2</strong></p>
  <p id="p7889159103912"><a name="p7889159103912"></a><a name="p7889159103912"></a><strong id="b7889297391"><a name="b7889297391"></a><a name="b7889297391"></a>3</strong></p>
  <p id="p1988909123915"><a name="p1988909123915"></a><a name="p1988909123915"></a><strong id="b9889093399"><a name="b9889093399"></a><a name="b9889093399"></a>4</strong></p>
  <p id="p1889298390"><a name="p1889298390"></a><a name="p1889298390"></a><strong id="b14889398391"><a name="b14889398391"></a><a name="b14889398391"></a>5</strong></p>
  <p id="p28897973913"><a name="p28897973913"></a><a name="p28897973913"></a><strong id="b989017916396"><a name="b989017916396"></a><a name="b989017916396"></a>6</strong></p>
  <p id="p6890139133914"><a name="p6890139133914"></a><a name="p6890139133914"></a><strong id="b118901593399"><a name="b118901593399"></a><a name="b118901593399"></a>7</strong></p>
  <p id="p08902923915"><a name="p08902923915"></a><a name="p08902923915"></a><strong id="b19890994395"><a name="b19890994395"></a><a name="b19890994395"></a>8</strong></p>
  <p id="p88904993912"><a name="p88904993912"></a><a name="p88904993912"></a><strong id="b10890109193919"><a name="b10890109193919"></a><a name="b10890109193919"></a>9</strong></p>
  <p id="p128907983917"><a name="p128907983917"></a><a name="p128907983917"></a><strong id="b3890189113918"><a name="b3890189113918"></a><a name="b3890189113918"></a>10</strong></p>
  <p id="p48900973916"><a name="p48900973916"></a><a name="p48900973916"></a><strong id="b1789019133916"><a name="b1789019133916"></a><a name="b1789019133916"></a>11</strong></p>
  </td>
  <td class="cellrowborder" valign="top" width="93.31%"><p id="p7891995391"><a name="p7891995391"></a><a name="p7891995391"></a>-- (1) Use the key management tool <strong id="b48911098395"><a name="b48911098395"></a><a name="b48911098395"></a>gs_ktool</strong> to create a key. The tool returns the ID of the newly generated key.</p>
  <p id="p118913913911"><a name="p118913913911"></a><a name="p118913913911"></a><strong id="b108913963919"><a name="b108913963919"></a><a name="b108913963919"></a><span>[</span></strong>cmd<strong id="b188912915392"><a name="b188912915392"></a><a name="b188912915392"></a><span>]</span></strong> gs_ktool <strong id="b789259103910"><a name="b789259103910"></a><a name="b789259103910"></a><span>-</span></strong>g</p>
  <p id="p198921099393"><a name="p198921099393"></a><a name="p198921099393"></a></p>
  <p id="p0892595399"><a name="p0892595399"></a><a name="p0892595399"></a>-- (2) Use a privileged account to create a common user named <strong id="b1589213912393"><a name="b1589213912393"></a><a name="b1589213912393"></a>alice</strong>.</p>
  <p id="p7892293395"><a name="p7892293395"></a><a name="p7892293395"></a>openGauss<strong id="b289299153915"><a name="b289299153915"></a><a name="b289299153915"></a><span>=</span></strong># <strong id="b11892890390"><a name="b11892890390"></a><a name="b11892890390"></a><span>CREATE</span></strong> <strong id="b389239203913"><a name="b389239203913"></a><a name="b389239203913"></a><span>USER</span></strong> alice PASSWORD <span>'********'</span><strong id="b189219953910"><a name="b189219953910"></a><a name="b189219953910"></a><span>;</span></strong></p>
  <p id="p3892595394"><a name="p3892595394"></a><a name="p3892595394"></a></p>
  <p id="p489299183917"><a name="p489299183917"></a><a name="p489299183917"></a>-- (3) Use the account of common user <strong id="b208921197396"><a name="b208921197396"></a><a name="b208921197396"></a>alice</strong> to connect to the encrypted database and execute the syntax.</p>
  <p id="p28921296393"><a name="p28921296393"></a><a name="p28921296393"></a>gsql <strong id="b289210953915"><a name="b289210953915"></a><a name="b289210953915"></a><span>-</span></strong>p <span>57101</span> postgres <strong id="b789279113917"><a name="b789279113917"></a><a name="b789279113917"></a><span>-</span></strong>U alice <strong id="b189316943915"><a name="b189316943915"></a><a name="b189316943915"></a><span>-</span></strong>r <strong id="b12893598392"><a name="b12893598392"></a><a name="b12893598392"></a><span>-</span></strong>C</p>
  <p id="p4893189113920"><a name="p4893189113920"></a><a name="p4893189113920"></a></p>
  <p id="p68936933919"><a name="p68936933919"></a><a name="p68936933919"></a>-- Create a CMK object.</p>
  <p id="p1489314923920"><a name="p1489314923920"></a><a name="p1489314923920"></a>openGauss<strong id="b208931914391"><a name="b208931914391"></a><a name="b208931914391"></a><span>=</span><span>&gt;</span></strong> <strong id="b19893190394"><a name="b19893190394"></a><a name="b19893190394"></a><span>CREATE</span></strong> CLIENT MASTER <strong id="b889316913911"><a name="b889316913911"></a><a name="b889316913911"></a><span>KEY</span></strong> alice_cmk <strong id="b08933911391"><a name="b08933911391"></a><a name="b08933911391"></a><span>WITH</span></strong> <strong id="b1889416917392"><a name="b1889416917392"></a><a name="b1889416917392"></a><span>(</span></strong> KEY_STORE <strong id="b689459163912"><a name="b689459163912"></a><a name="b689459163912"></a><span>=</span></strong> gs_ktool <strong id="b989429133916"><a name="b989429133916"></a><a name="b989429133916"></a><span>,</span></strong> KEY_PATH <strong id="b7894159193911"><a name="b7894159193911"></a><a name="b7894159193911"></a><span>=</span></strong> <span>"gs_ktool/1"</span> <strong id="b289410911395"><a name="b289410911395"></a><a name="b289410911395"></a><span>,</span></strong> ALGORITHM <strong id="b28941992393"><a name="b28941992393"></a><a name="b28941992393"></a><span>=</span></strong> AES_256_CBC<strong id="b1894189153915"><a name="b1894189153915"></a><a name="b1894189153915"></a><span>);</span></strong></p>
  <p id="p17894149173920"><a name="p17894149173920"></a><a name="p17894149173920"></a>-- Create a CEK object.</p>
  <p id="p19894109123916"><a name="p19894109123916"></a><a name="p19894109123916"></a>openGauss<strong id="b18894149143915"><a name="b18894149143915"></a><a name="b18894149143915"></a><span>=</span><span>&gt;</span></strong> <strong id="b189439113920"><a name="b189439113920"></a><a name="b189439113920"></a><span>CREATE</span></strong> <strong id="b178941297391"><a name="b178941297391"></a><a name="b178941297391"></a><span>COLUMN</span></strong> ENCRYPTION <strong id="b1489510933915"><a name="b1489510933915"></a><a name="b1489510933915"></a><span>KEY</span></strong> a_cek <strong id="b20895119173920"><a name="b20895119173920"></a><a name="b20895119173920"></a><span>WITH</span></strong> <strong id="b1189599113917"><a name="b1189599113917"></a><a name="b1189599113917"></a><span>VALUES</span></strong> <strong id="b5895693399"><a name="b5895693399"></a><a name="b5895693399"></a><span>(</span></strong>CLIENT_MASTER_KEY <strong id="b10895199203911"><a name="b10895199203911"></a><a name="b10895199203911"></a><span>=</span></strong> a_cmk<strong id="b78958910395"><a name="b78958910395"></a><a name="b78958910395"></a><span>,</span></strong> ALGORITHM  <strong id="b18951790391"><a name="b18951790391"></a><a name="b18951790391"></a><span>=</span></strong> AEAD_AES_256_CBC_HMAC_SHA256<strong id="b1895129173914"><a name="b1895129173914"></a><a name="b1895129173914"></a><span>);</span></strong></p>
  <p id="p5895593399"><a name="p5895593399"></a><a name="p5895593399"></a><strong id="b138951099392"><a name="b138951099392"></a><a name="b138951099392"></a></strong></p>
  <p id="p2089559133916"><a name="p2089559133916"></a><a name="p2089559133916"></a>openGauss<strong id="b16895169123912"><a name="b16895169123912"></a><a name="b16895169123912"></a><span>=</span><span>&gt;</span></strong> <strong id="b689613973911"><a name="b689613973911"></a><a name="b689613973911"></a><span>CREATE</span></strong> <strong id="b13896999391"><a name="b13896999391"></a><a name="b13896999391"></a><span>COLUMN</span></strong> ENCRYPTION <strong id="b1489699163919"><a name="b1489699163919"></a><a name="b1489699163919"></a><span>KEY</span></strong> another_cek <strong id="b789609143911"><a name="b789609143911"></a><a name="b789609143911"></a><span>WITH</span></strong> <strong id="b1889669183917"><a name="b1889669183917"></a><a name="b1889669183917"></a><span>VALUES</span></strong> <strong id="b88965903913"><a name="b88965903913"></a><a name="b88965903913"></a><span>(</span></strong>CLIENT_MASTER_KEY <strong id="b12896199133913"><a name="b12896199133913"></a><a name="b12896199133913"></a><span>=</span></strong> a_cmk<strong id="b389639173915"><a name="b389639173915"></a><a name="b389639173915"></a><span>,</span></strong> ALGORITHM  <strong id="b15896997391"><a name="b15896997391"></a><a name="b15896997391"></a><span>=</span></strong> SM4_SM3<strong id="b1389629133918"><a name="b1389629133918"></a><a name="b1389629133918"></a><span>);</span></strong></p>
  </td>
  </tr>
  </tbody>
  </table>

-   **2. Creating a CMK and a CEK in the JDBC Environment**

    <a name="table1030410813395"></a>
    <table><tbody><tr id="row3897189163918"><td class="cellrowborder" valign="top" width="5.42%"><p id="p1089789173913"><a name="p1089789173913"></a><a name="p1089789173913"></a><strong id="b16897997394"><a name="b16897997394"></a><a name="b16897997394"></a>1</strong></p>
    <p id="p78970910392"><a name="p78970910392"></a><a name="p78970910392"></a><strong id="b118975912399"><a name="b118975912399"></a><a name="b118975912399"></a>2</strong></p>
        <p id="p889720913391"><a name="p889720913391"></a><a name="p889720913391"></a><strong id="b88971914397"><a name="b88971914397"></a><a name="b88971914397"></a>3</strong></p>
        <p id="p389720919392"><a name="p389720919392"></a><a name="p389720919392"></a><strong id="b1897499397"><a name="b1897499397"></a><a name="b1897499397"></a>4</strong></p>
        <p id="p168979903914"><a name="p168979903914"></a><a name="p168979903914"></a><strong id="b189719913393"><a name="b189719913393"></a><a name="b189719913393"></a>5</strong></p>
        <p id="p1189713918397"><a name="p1189713918397"></a><a name="p1189713918397"></a><strong id="b589779163915"><a name="b589779163915"></a><a name="b589779163915"></a>6</strong></p>
    <p id="p1089711916397"><a name="p1089711916397"></a><a name="p1089711916397"></a><strong id="b1897194397"><a name="b1897194397"></a><a name="b1897194397"></a>7</strong></p>
    <p id="p489749153910"><a name="p489749153910"></a><a name="p489749153910"></a><strong id="b3897179153912"><a name="b3897179153912"></a><a name="b3897179153912"></a>8</strong></p>
    </td>
    <td class="cellrowborder" valign="top" width="94.58%"><p id="p1291315918398"><a name="p1291315918398"></a><a name="p1291315918398"></a>// Create a CMK.</p>
    <p id="p8913895394"><a name="p8913895394"></a><a name="p8913895394"></a>Connection conn <strong id="b0913794392"><a name="b0913794392"></a><a name="b0913794392"></a><span>=</span></strong> DriverManager<strong id="b129131697396"><a name="b129131697396"></a><a name="b129131697396"></a><span>.</span></strong>getConnection<strong id="b3914169113914"><a name="b3914169113914"></a><a name="b3914169113914"></a><span>(</span></strong><span>"url"</span><strong id="b1591479103915"><a name="b1591479103915"></a><a name="b1591479103915"></a><span>,</span></strong><span>"user"</span><strong id="b18914397394"><a name="b18914397394"></a><a name="b18914397394"></a><span>,</span></strong><span>"password"</span><strong id="b189147915397"><a name="b189147915397"></a><a name="b189147915397"></a><span>);</span></strong></p>
    <p id="p39142920393"><a name="p39142920393"></a><a name="p39142920393"></a>Statement stmt <strong id="b191416993920"><a name="b191416993920"></a><a name="b191416993920"></a><span>=</span></strong> conn<strong id="b1391418913398"><a name="b1391418913398"></a><a name="b1391418913398"></a><span>.</span></strong>createStatement<strong id="b1691418914397"><a name="b1691418914397"></a><a name="b1691418914397"></a><span>();</span></strong></p>
    <p id="p199146915391"><a name="p199146915391"></a><a name="p199146915391"></a><span>int</span> rc <strong id="b491489153912"><a name="b491489153912"></a><a name="b491489153912"></a><span>=</span></strong> stmt<strong id="b691449153920"><a name="b691449153920"></a><a name="b691449153920"></a><span>.</span></strong>executeUpdate<strong id="b6914169153911"><a name="b6914169153911"></a><a name="b6914169153911"></a><span>(</span></strong><span>"CREATE CLIENT MASTER KEY ImgCMK1 WITH ( KEY_STORE = gs_ktool , KEY_PATH = \"gs_ktool/1\" , ALGORITHM = AES_256_CBC);"</span><strong id="b09141191395"><a name="b09141191395"></a><a name="b09141191395"></a><span>);</span></strong></p>
    <p id="p691499123910"><a name="p691499123910"></a><a name="p691499123910"></a></p>
    <p id="p1291512953911"><a name="p1291512953911"></a><a name="p1291512953911"></a>// Create a CEK.</p>
    <p id="p391599143917"><a name="p391599143917"></a><a name="p391599143917"></a><span>int</span> rc2 <strong id="b17915796395"><a name="b17915796395"></a><a name="b17915796395"></a><span>=</span></strong> stmt<strong id="b129151398393"><a name="b129151398393"></a><a name="b129151398393"></a><span>.</span></strong>executeUpdate<strong id="b1091512943910"><a name="b1091512943910"></a><a name="b1091512943910"></a><span>(</span></strong><span>"CREATE COLUMN ENCRYPTION KEY ImgCEK1 WITH VALUES (CLIENT_MASTER_KEY = ImgCMK1, ALGORITHM  = AEAD_AES_256_CBC_HMAC_SHA256);"</span><strong id="b11915894390"><a name="b11915894390"></a><a name="b11915894390"></a><span>);</span></strong></p>
    </td>
    </tr>
    </tbody>
    </table>
### 3.3 Creating an Encrypted Table

After creating the CMK and CEK, you can use the CEK to create an encrypted table.

An encrypted table can be created in two modes: randomized encryption and deterministic encryption.

-   **Creating an Encrypted Table in the GSQL Environment**

\[Example\]

<a name="table183445819392"></a>
<table><tbody><tr id="row691519903919"><td class="cellrowborder" valign="top" width="6.69%"><p id="p149154933913"><a name="p149154933913"></a><a name="p149154933913"></a><strong id="b1091529183920"><a name="b1091529183920"></a><a name="b1091529183920"></a>1</strong></p>
<p id="p7915149113913"><a name="p7915149113913"></a><a name="p7915149113913"></a><strong id="b1991517993915"><a name="b1991517993915"></a><a name="b1991517993915"></a>2</strong></p>
<p id="p091579153920"><a name="p091579153920"></a><a name="p091579153920"></a><strong id="b199151096394"><a name="b199151096394"></a><a name="b199151096394"></a>3</strong></p>
</td>
<td class="cellrowborder" valign="top" width="93.31%"><p id="p1191615953913"><a name="p1191615953913"></a><a name="p1191615953913"></a>openGauss<strong id="b1091619193917"><a name="b1091619193917"></a><a name="b1091619193917"></a><span>=</span></strong># <strong id="b79163917390"><a name="b79163917390"></a><a name="b79163917390"></a><span>CREATE</span></strong> <strong id="b129164933914"><a name="b129164933914"></a><a name="b129164933914"></a><span>TABLE</span></strong> creditcard_info <strong id="b991613912392"><a name="b991613912392"></a><a name="b991613912392"></a><span>(</span></strong>id_number <strong id="b19162993912"><a name="b19162993912"></a><a name="b19162993912"></a><span>int</span><span>,</span></strong></p>
<p id="p1391617943915"><a name="p1391617943915"></a><a name="p1391617943915"></a>name text encrypted <strong id="b491689153918"><a name="b491689153918"></a><a name="b491689153918"></a><span>with</span></strong> <strong id="b189162913393"><a name="b189162913393"></a><a name="b189162913393"></a><span>(</span></strong>column_encryption_key <strong id="b1091679203910"><a name="b1091679203910"></a><a name="b1091679203910"></a><span>=</span></strong> ImgCEK<strong id="b1491789143916"><a name="b1491789143916"></a><a name="b1491789143916"></a><span>,</span></strong> encryption_type <strong id="b14917139133910"><a name="b14917139133910"></a><a name="b14917139133910"></a><span>=</span></strong> <strong id="b29177920390"><a name="b29177920390"></a><a name="b29177920390"></a><span>DETERMINISTIC</span><span>),</span></strong></p>
<p id="p16917159123916"><a name="p16917159123916"></a><a name="p16917159123916"></a>credit_card  <strong id="b391719917393"><a name="b391719917393"></a><a name="b391719917393"></a><span>varchar</span><span>(</span></strong><span>19</span><strong id="b391720915398"><a name="b391720915398"></a><a name="b391720915398"></a><span>)</span></strong> encrypted <strong id="b2918109153920"><a name="b2918109153920"></a><a name="b2918109153920"></a><span>with</span></strong> <strong id="b1791813923918"><a name="b1791813923918"></a><a name="b1791813923918"></a><span>(</span></strong>column_encryption_key <strong id="b99180913391"><a name="b99180913391"></a><a name="b99180913391"></a><span>=</span></strong> ImgCEK1<strong id="b119189920394"><a name="b119189920394"></a><a name="b119189920394"></a><span>,</span></strong> encryption_type <strong id="b99193993914"><a name="b99193993914"></a><a name="b99193993914"></a><span>=</span></strong> <strong id="b209198973913"><a name="b209198973913"></a><a name="b209198973913"></a><span>DETERMINISTIC</span><span>));</span></strong></p>
</td>
</tr>
</tbody>
</table>

Parameter description:

**ENCRYPTION\_TYPE**  indicates the encryption type in the ENCRYPTED WITH constraint. The value of  **encryption\_type\_value**  can be  **DETERMINISTIC**  or  **RANDOMIZED**.

****

-   **Creating an Encrypted Table in the JDBC Environment**

<a name="table163643815395"></a>
<table><tbody><tr id="row1919209133919"><td class="cellrowborder" valign="top" width="6.69%"><p id="p13919894392"><a name="p13919894392"></a><a name="p13919894392"></a><strong id="b391959133920"><a name="b391959133920"></a><a name="b391959133920"></a>1</strong></p>
<p id="p8920159203915"><a name="p8920159203915"></a><a name="p8920159203915"></a><strong id="b119201292395"><a name="b119201292395"></a><a name="b119201292395"></a>2</strong></p>
</td>
<td class="cellrowborder" valign="top" width="93.31%"><p id="p292019953911"><a name="p292019953911"></a><a name="p292019953911"></a><span>int</span> rc3 <strong id="b1292079103910"><a name="b1292079103910"></a><a name="b1292079103910"></a><span>=</span></strong> stmt<strong id="b692012953916"><a name="b692012953916"></a><a name="b692012953916"></a><span>.</span></strong>executeUpdate<strong id="b592089163912"><a name="b592089163912"></a><a name="b592089163912"></a><span>(</span></strong><span>"CREATE TABLE creditcard_info (id_number    int, name  varchar(50) encrypted with (column_encryption_key = ImgCEK1, encryption_type = DETERMINISTIC),credit_card  varchar(19) encrypted with (column_encryption_key = ImgCEK1, encryption_type = DETERMINISTIC));"</span><strong id="b2092016919390"><a name="b2092016919390"></a><a name="b2092016919390"></a><span>);</span></strong></p>
</td>
</tr>
</tbody>
</table>

### 3.4 Inserting Data into the Encrypted Table and Querying the Data

After an encrypted table is created, you can insert and view data in the encrypted table in encrypted database mode \(enabling the connection parameter  **-C**\). When the common environment \(disabling the connection parameter  **-C**\) is used, operations cannot be performed on the encrypted table, and only ciphertext data can be viewed in the encrypted table.

-   **Inserting Data into the Encrypted Table and Viewing the Data in the GSQL Environment**

    <a name="table1377581398"></a>
    <table><tbody><tr id="row199215911399"><td class="cellrowborder" valign="top" width="6.69%"><p id="p1592116910398"><a name="p1592116910398"></a><a name="p1592116910398"></a><strong id="b592111918391"><a name="b592111918391"></a><a name="b592111918391"></a>1</strong></p>
    <p id="p192179163916"><a name="p192179163916"></a><a name="p192179163916"></a><strong id="b592111917399"><a name="b592111917399"></a><a name="b592111917399"></a>2</strong></p>
    <p id="p149211598397"><a name="p149211598397"></a><a name="p149211598397"></a><strong id="b14921290399"><a name="b14921290399"></a><a name="b14921290399"></a>3</strong></p>
    <p id="p992120910391"><a name="p992120910391"></a><a name="p992120910391"></a><strong id="b1392439193918"><a name="b1392439193918"></a><a name="b1392439193918"></a>4</strong></p>
    <p id="p692439153913"><a name="p692439153913"></a><a name="p692439153913"></a><strong id="b1192459153917"><a name="b1192459153917"></a><a name="b1192459153917"></a>5</strong></p>
    <p id="p89242963911"><a name="p89242963911"></a><a name="p89242963911"></a><strong id="b19924149123914"><a name="b19924149123914"></a><a name="b19924149123914"></a>6</strong></p>
    <p id="p99245983915"><a name="p99245983915"></a><a name="p99245983915"></a><strong id="b1192439133910"><a name="b1192439133910"></a><a name="b1192439133910"></a>7</strong></p>
    <p id="p29248911392"><a name="p29248911392"></a><a name="p29248911392"></a><strong id="b1592489123912"><a name="b1592489123912"></a><a name="b1592489123912"></a>8</strong></p>
    <p id="p5924119193915"><a name="p5924119193915"></a><a name="p5924119193915"></a><strong id="b292410920391"><a name="b292410920391"></a><a name="b292410920391"></a>9</strong></p>
    </td>
    <td class="cellrowborder" valign="top" width="93.31%"><p id="p179241910399"><a name="p179241910399"></a><a name="p179241910399"></a>openGauss<strong id="b1792513914395"><a name="b1792513914395"></a><a name="b1792513914395"></a><span>=</span></strong># <strong id="b1492517915396"><a name="b1492517915396"></a><a name="b1492517915396"></a><span>INSERT</span></strong> <strong id="b1192510913396"><a name="b1192510913396"></a><a name="b1192510913396"></a><span>INTO</span></strong> creditcard_info <strong id="b39258973919"><a name="b39258973919"></a><a name="b39258973919"></a><span>VALUES</span></strong> <strong id="b1492510912399"><a name="b1492510912399"></a><a name="b1492510912399"></a><span>(</span></strong><span>1</span><strong id="b169257933915"><a name="b169257933915"></a><a name="b169257933915"></a><span>,</span></strong><span>'joe'</span><strong id="b69251698399"><a name="b69251698399"></a><a name="b69251698399"></a><span>,</span></strong><span>'6217986500001288393'</span><strong id="b392515983912"><a name="b392515983912"></a><a name="b392515983912"></a><span>);</span></strong></p>
    <p id="p1792569183913"><a name="p1792569183913"></a><a name="p1792569183913"></a><strong id="b159252092395"><a name="b159252092395"></a><a name="b159252092395"></a><span>INSERT</span></strong> <span>0</span> <span>1</span></p>
    <p id="p129265953916"><a name="p129265953916"></a><a name="p129265953916"></a>openGauss<strong id="b09265923913"><a name="b09265923913"></a><a name="b09265923913"></a><span>=</span></strong># <strong id="b49261094391"><a name="b49261094391"></a><a name="b49261094391"></a><span>INSERT</span></strong> <strong id="b192610918396"><a name="b192610918396"></a><a name="b192610918396"></a><span>INTO</span></strong> creditcard_info <strong id="b89266919397"><a name="b89266919397"></a><a name="b89266919397"></a><span>VALUES</span></strong> <strong id="b4926179133915"><a name="b4926179133915"></a><a name="b4926179133915"></a><span>(</span></strong><span>2</span><strong id="b492679133911"><a name="b492679133911"></a><a name="b492679133911"></a><span>,</span></strong> <span>'joy'</span><strong id="b1492609133911"><a name="b1492609133911"></a><a name="b1492609133911"></a><span>,</span></strong><span>'6219985678349800033'</span><strong id="b199262096393"><a name="b199262096393"></a><a name="b199262096393"></a><span>);</span></strong></p>
    <p id="p1392713993916"><a name="p1392713993916"></a><a name="p1392713993916"></a><strong id="b892718993919"><a name="b892718993919"></a><a name="b892718993919"></a><span>INSERT</span></strong> <span>0</span> <span>1</span></p>
    <p id="p129272943918"><a name="p129272943918"></a><a name="p129272943918"></a>openGauss<strong id="b79277914396"><a name="b79277914396"></a><a name="b79277914396"></a><span>=</span></strong># <strong id="b392717963910"><a name="b392717963910"></a><a name="b392717963910"></a><span>select</span></strong> <strong id="b192719918399"><a name="b192719918399"></a><a name="b192719918399"></a><span>*</span></strong> <strong id="b14927149123910"><a name="b14927149123910"></a><a name="b14927149123910"></a><span>from</span></strong> creditcard_info <strong id="b792749193913"><a name="b792749193913"></a><a name="b792749193913"></a><span>where</span></strong> name <strong id="b1792711916396"><a name="b1792711916396"></a><a name="b1792711916396"></a><span>=</span></strong> <span>'joe'</span><strong id="b8927897393"><a name="b8927897393"></a><a name="b8927897393"></a><span>;</span></strong></p>
    <p id="p192710910395"><a name="p192710910395"></a><a name="p192710910395"></a>id_number <strong id="b12927169113913"><a name="b12927169113913"></a><a name="b12927169113913"></a><span>|</span></strong> name <strong id="b119284919396"><a name="b119284919396"></a><a name="b119284919396"></a><span>|</span></strong>     credit_card</p>
    <p id="p192818993919"><a name="p192818993919"></a><a name="p192818993919"></a><span>-----------+------+---------------------</span></p>
    <p id="p79287963913"><a name="p79287963913"></a><a name="p79287963913"></a><span>1</span> <strong id="b7928139133915"><a name="b7928139133915"></a><a name="b7928139133915"></a><span>|</span></strong> joe  <strong id="b892816919391"><a name="b892816919391"></a><a name="b892816919391"></a><span>|</span></strong> <span>6217986500001288393</span></p>
    <p id="p99281490397"><a name="p99281490397"></a><a name="p99281490397"></a><strong id="b1192810973918"><a name="b1192810973918"></a><a name="b1192810973918"></a><span>(</span></strong><span>1</span> <strong id="b992818933915"><a name="b992818933915"></a><a name="b992818933915"></a><span>row</span><span>)</span></strong></p>
    </td>
    </tr>
    </tbody>
    </table>

    Note: The data in the encrypted table is displayed in ciphertext when you use a non-encrypted client to view the data.

    <a name="table14331812397"></a>
    <table><tbody><tr id="row392918912392"><td class="cellrowborder" valign="top" width="5.06%"><p id="p1092910915398"><a name="p1092910915398"></a><a name="p1092910915398"></a><strong id="b19929189113918"><a name="b19929189113918"></a><a name="b19929189113918"></a>1</strong></p>
    <p id="p392929193910"><a name="p392929193910"></a><a name="p392929193910"></a><strong id="b89291695399"><a name="b89291695399"></a><a name="b89291695399"></a>2</strong></p>
    <p id="p1192917983910"><a name="p1192917983910"></a><a name="p1192917983910"></a><strong id="b169291963910"><a name="b169291963910"></a><a name="b169291963910"></a>3</strong></p>
    <p id="p139294963919"><a name="p139294963919"></a><a name="p139294963919"></a><strong id="b16929209143914"><a name="b16929209143914"></a><a name="b16929209143914"></a>4</strong></p>
    <p id="p4929295399"><a name="p4929295399"></a><a name="p4929295399"></a><strong id="b1892979183919"><a name="b1892979183919"></a><a name="b1892979183919"></a>5</strong></p>
    <p id="p59299943917"><a name="p59299943917"></a><a name="p59299943917"></a><strong id="b169291910395"><a name="b169291910395"></a><a name="b169291910395"></a>6</strong></p>
    </td>
    <td class="cellrowborder" valign="top" width="94.94%"><p id="p992910983912"><a name="p992910983912"></a><a name="p992910983912"></a>openGauss<strong id="b1492913911390"><a name="b1492913911390"></a><a name="b1492913911390"></a><span>=</span></strong># <strong id="b1493016919393"><a name="b1493016919393"></a><a name="b1493016919393"></a><span>select</span></strong> id_number<strong id="b5930129173913"><a name="b5930129173913"></a><a name="b5930129173913"></a><span>,</span></strong>name <strong id="b179301292395"><a name="b179301292395"></a><a name="b179301292395"></a><span>from</span></strong> creditcard_info<strong id="b093011915394"><a name="b093011915394"></a><a name="b093011915394"></a><span>;</span></strong></p>
    <p id="p793099183914"><a name="p793099183914"></a><a name="p793099183914"></a>id_number <strong id="b693039163919"><a name="b693039163919"></a><a name="b693039163919"></a><span>|</span></strong>                name</p>
    <p id="p19930169123917"><a name="p19930169123917"></a><a name="p19930169123917"></a><span>-----------+-------------------------------------------</span></p>
    <p id="p1093114983912"><a name="p1093114983912"></a><a name="p1093114983912"></a><span>1</span> <strong id="b5931598393"><a name="b5931598393"></a><a name="b5931598393"></a><span>|</span></strong> \x011aefabd754ded0a536a96664790622487c4d36</p>
    <p id="p1493114973918"><a name="p1493114973918"></a><a name="p1493114973918"></a><span>2</span> <strong id="b10931189173920"><a name="b10931189173920"></a><a name="b10931189173920"></a><span>|</span></strong> \x011aefabd76853108eb406c0f90e7c773b71648f</p>
    <p id="p11931593396"><a name="p11931593396"></a><a name="p11931593396"></a><strong id="b793113993911"><a name="b793113993911"></a><a name="b793113993911"></a><span>(</span></strong><span>2</span> <strong id="b189311894398"><a name="b189311894398"></a><a name="b189311894398"></a><span>rows</span><span>)</span></strong></p>
    </td>
    </tr>
    </tbody>
    </table>

-   **Inserting Data into the Encrypted Table and Viewing the Data in the JDBC Environment**

    <a name="table624365164617"></a>
    <table><tbody><tr id="row524295113463"><td class="cellrowborder" valign="top" width="5.42%"><p id="p152376516467"><a name="p152376516467"></a><a name="p152376516467"></a><strong id="b2237551104618"><a name="b2237551104618"></a><a name="b2237551104618"></a>1</strong></p>
    <p id="p2237851134618"><a name="p2237851134618"></a><a name="p2237851134618"></a><strong id="b923719510463"><a name="b923719510463"></a><a name="b923719510463"></a>2</strong></p>
    <p id="p12238115117469"><a name="p12238115117469"></a><a name="p12238115117469"></a><strong id="b323713511466"><a name="b323713511466"></a><a name="b323713511466"></a>3</strong></p>
    <p id="p1223885116463"><a name="p1223885116463"></a><a name="p1223885116463"></a><strong id="b15238155111467"><a name="b15238155111467"></a><a name="b15238155111467"></a>4</strong></p>
    <p id="p0238105115469"><a name="p0238105115469"></a><a name="p0238105115469"></a><strong id="b17238125111466"><a name="b17238125111466"></a><a name="b17238125111466"></a>5</strong></p>
    <p id="p82386512468"><a name="p82386512468"></a><a name="p82386512468"></a><strong id="b1223855114610"><a name="b1223855114610"></a><a name="b1223855114610"></a>6</strong></p>
    <p id="p11238205124612"><a name="p11238205124612"></a><a name="p11238205124612"></a><strong id="b82380516462"><a name="b82380516462"></a><a name="b82380516462"></a>7</strong></p>
    </td>
    <td class="cellrowborder" valign="top" width="94.58%"><p id="p423935115466"><a name="p423935115466"></a><a name="p423935115466"></a>// Insert data.</p>
    <p id="p72401651174618"><a name="p72401651174618"></a><a name="p72401651174618"></a><span>int</span> rc4 <strong id="b11239125117469"><a name="b11239125117469"></a><a name="b11239125117469"></a><span>=</span></strong> stmt<strong id="b1223917518468"><a name="b1223917518468"></a><a name="b1223917518468"></a><span>.</span></strong>executeUpdate<strong id="b5239125112461"><a name="b5239125112461"></a><a name="b5239125112461"></a><span>(</span></strong><span>"INSERT INTO creditcard_info VALUES (1,'joe','6217986500001288393');"</span><strong id="b11239051194618"><a name="b11239051194618"></a><a name="b11239051194618"></a><span>);</span></strong></p>
    <p id="p0240451104615"><a name="p0240451104615"></a><a name="p0240451104615"></a>// Query the encrypted table.</p>
    <p id="p2240185115463"><a name="p2240185115463"></a><a name="p2240185115463"></a>ResultSet rs <strong id="b19240155134617"><a name="b19240155134617"></a><a name="b19240155134617"></a><span>=</span></strong> <strong id="b32407516468"><a name="b32407516468"></a><a name="b32407516468"></a><span>null</span><span>;</span></strong></p>
    <p id="p4241651184614"><a name="p4241651184614"></a><a name="p4241651184614"></a>rs <strong id="b524045134611"><a name="b524045134611"></a><a name="b524045134611"></a><span>=</span></strong> stmt<strong id="b3241185104620"><a name="b3241185104620"></a><a name="b3241185104620"></a><span>.</span></strong>executeQuery<strong id="b14241165194616"><a name="b14241165194616"></a><a name="b14241165194616"></a><span>(</span></strong><span>"select * from creditcard_info where name = 'joe';"</span><strong id="b102416512468"><a name="b102416512468"></a><a name="b102416512468"></a><span>);</span></strong></p>
    <p id="p624155194613"><a name="p624155194613"></a><a name="p624155194613"></a>// Close the statement object.</p>
    <p id="p11242951104614"><a name="p11242951104614"></a><a name="p11242951104614"></a>stmt<strong id="b112414514462"><a name="b112414514462"></a><a name="b112414514462"></a><span>.</span></strong>close<strong id="b1124210518468"><a name="b1124210518468"></a><a name="b1124210518468"></a><span>();</span></strong></p>
    </td>
    </tr>
    </tbody>
    </table>

    The preceding describes how to use the fully-encrypted database features. For details, see the corresponding sections in the official document. However, for a common user, the functions described above are sufficient to ensure smooth implementation of daily work. In the future, fully-encrypted databases will evolve to be easier to use and provide higher performance. Stay tuned!



