+++

title = "openGauss/MogDB零字节问题处理" 

date = "2022-04-12" 

tags = ["openGauss/MogDB零字节问题处理"] 

archives = "2022-04" 

author = "彭冲" 

summary = "openGauss/MogDB零字节问题处理"

img = "/zh/post/pengchong/title/img6.png" 

times = "10:20"
+++

# openGauss/MogDB零字节问题处理

本文出处：https://www.modb.pro/db/196647



问题描述：java应用端程序调用GZIP压缩类对数据进行编码压缩后入库 ，然后从数据库取出进行解压，原来再mysql数据库中是正常的，但迁移到openGauss/mogdb之后，解压出来的数据是乱码，不正常。

mysql端表结构如下：

```sql
CREATE TABLE `test` (
  `id` bigint(20) NOT NULL,
  `info` varchar(20) NOT NULL,
  `info2` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci ROW_FORMAT=DYNAMIC;
```

迁移到MogDB后表结构如下：

```sql
create table test( id int, info text, info2 text ); 
```

java压缩接口方法如下：

```java
    public static String compress(String str) throws IOException {
        if (null == str || str.length() <= 0) {
            return str;
        }
        GZIPOutputStream gzip = null;
        // 创建一个新的输出流
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            // 使用默认缓冲区大小创建新的输出流
            gzip = new GZIPOutputStream(out);
            // 将字节写入此输出流
            gzip.write(str.getBytes("utf-8"));
            // 因为后台默认字符集有可能是GBK字符集，所以此处需指定一个字符集
            gzip.close();
            // 使用指定的 charsetName，通过解码字节将缓冲区内容转换为字符串
            return out.toString("ISO-8859-1");
        } finally {
            closeQuietly(gzip);
            closeQuietly(out);
        }
    }

```

java解压接口方法如下：

```java
   public static String unCompress(String str) throws IOException {
        GZIPInputStream gzip = null;
        if (null == str || str.length() <= 0) {
            return str;
        }
        // 创建一个新的输出流
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        // 创建一个 ByteArrayInputStream，使用 buf 作为其缓冲 区数组
        ByteArrayInputStream in = new ByteArrayInputStream(str.getBytes("ISO-8859-1"));
        try {
            // 使用默认缓冲区大小创建新的输入流
            gzip = new GZIPInputStream(in);
            byte[] buffer = new byte[256];
            int n = 0;
            // 将未压缩数据读入字节数组
            while ((n = gzip.read(buffer)) >= 0) {
                out.write(buffer, 0, n);
            }
            // 使用指定的 charsetName，通过解码字节将缓冲区内容转换为字符串
            return out.toString("utf-8");
        } finally {
            closeQuietly(gzip);
            closeQuietly(in);
            closeQuietly(out);
        }
    }

```

测试用例部分关键代码参考如下：
1.对UTF8编码的字符串数据进行压缩，然后存到数据库中

```java
String str = "{\"name\":\"jerome\",\"familyName\":\"peng\",\"company\":\"enmotech\"}";

System.out.println("input:"+str);
        
String compress_java = GZipUtils.compress(str);
		
        try{
        	ps = conn.prepareStatement(sql);
        	ps.setInt(1, 100);
        	ps.setString(2, str);
        	ps.setString(3, compress_java);
        	ps.execute();
        } catch (Exception e) {
            e.printStackTrace();
        }

```

2.从数据库中取出字段进行解密

```java
        sql = " select info,info2 from test where id=100";
        ResultSet rs = null;
        try{
        	ps = conn.prepareStatement(sql);
        	rs = ps.executeQuery();
    	    while (rs.next()) {
    	    	String compress_db = rs.getString(2);
    	        String unCompress= GZipUtils2.unCompress(compress_db );
    	        System.out.println("output:"+unCompress);
    	    }
        } catch (Exception e) {
            e.printStackTrace();
        }
```

期望结果是从数据库中取出来的字符串能够解压出原始数据。也就是上面的unCompress变量输出的结果应该要与上面的str变量输出结果一致，应为：

```
{"name":"jerome","familyName":"peng","company":"enmotech"} 
```

如果我们在pg数据库里进行测试，上面测试第一步会报错提示无法对0字节进行存储

```
org.postgresql.util.PSQLException: ERROR: invalid byte sequence for encoding "UTF8": 0x00 
```

但在openGauss/MogDB里面，数据可以正常存储，不会报错，但是压缩接口进行解码时数据显示乱码。

下面我们对比入库前和入库后的字节序列（以hex字符形式显示，两个字符表示一个字节）：
入库前的hex字符串

```
1f8b0800000000000000ab56ca4bcc4d55b252ca4a2dca07327494d2127333732afd20a205a979e940b1e4fcdc82c4bc4aa0406a5e6e7e496a7286522d003efb28273a000000 
```

入库后的hex字符串

```
1f8b0820202020202020ab56ca4bcc4d55b252ca4a2dca07327494d2127333732afd20a205a979e940b1e4fcdc82c4bc4aa0406a5e6e7e496a7286522d203efb28273a202020 
```

我们发现其实是00与20的差异，所有的hex 00被转义为了hex 20，也就是0字节被转义为了空格。

既然知道了这个差异，那我们对取出的数据做一次反向替换，应该可以解决这个问题。

我们可以按字节进行读取，如果数值是32（hex 20对应十进制32）的字节，那我们就替换为0字节。

```java
if(bytes_src[i]==32) {
    bytes_dest[i]=(byte)0;
}else {
    bytes_dest[i]=bytes_src[i];
}
```

这样修改之后测试发现还是有问题，因为压缩后的字节数据里可能也包含hex 20，这样我们会把不该替换的字节也做了误处理。

进一步修正为只对首尾固定的部分进行处理，思路来源与GZIP公共类。

```
//头部10个字节或者尾部8个字节还原0字节 if((i<=10 || i>=len-1-8) && bytes_src[i]==32) {    bytes_dest[i]=(byte)0; }else {    bytes_dest[i]=bytes_src[i]; } 
```

这样处理后，测试数据可以正常解压，测试结果如下：

```java
input:{"name":"jerome","familyName":"peng","company":"enmotech"}
HEX_ja:1f8b0800000000000000ab56ca4bcc4d55b252ca4a2dca07327494d2127333732afd20a205a979e940b1e4fcdc82c4bc4aa0406a5e6e7e496a7286522d003efb28273a000000
HEX_db:1f8b0820202020202020ab56ca4bcc4d55b252ca4a2dca07327494d2127333732afd20a205a979e940b1e4fcdc82c4bc4aa0406a5e6e7e496a7286522d203efb28273a202020
HEX_cv:1f8b0800000000000000ab56ca4bcc4d55b252ca4a2dca07327494d2127333732afd20a205a979e940b1e4fcdc82c4bc4aa0406a5e6e7e496a7286522d003efb28273a000000
output:{"name":"jerome","familyName":"peng","company":"enmotech"}
可以看到输入与输出内容是一致的。
```
