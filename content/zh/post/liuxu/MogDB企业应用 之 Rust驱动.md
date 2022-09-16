+++

title = "MogDB企业应用 之 Rust驱动" 

date = "2022-08-29" 

tags = ["MogDB企业应用 之 Rust驱动"] 

archives = "2022-08" 

author = "云和恩墨" 

summary = "MogDB企业应用 之 Rust驱动"

img = "/zh/post/zhangcuiping/title/img.png" 

times = "15:20"

+++

# MogDB企业应用 之 Rust驱动



# 引子

Rust是一门系统编程语言，专注于安全，尤其是并发安全，支持函数式和命令式以及泛型等编程范式的多范式语言。Rust在语法上和类似C++，但是设计者想要在保证性能的同时提供更好的内存安全。

Rust已经逐步开始进入企业应用和操作系统的内核开发，之前听过几次openEuler SIG组的双周会，一些内核模块已经或即将使用Rust进行开发，虽然一些现代的开发语言现在还很难撼动传统的C/C++ 地位。但是像go和Rust已经开始在一些领域里面崭露头角。go的目标是取代C，而Rust则号称是C++ 的最佳接班人。

一些大企业已经开始使用Rust进行核心业务的替代，同时也开始替代一些底层的基础库。在数据库领域Rust也逐步开始完善其功能。Rust提供了PostgreSQL的客户端驱动的同时还提供了插件扩展（PGX）和过程语言（plrust）。经过尝试因为后两者由于涉及ABI不兼容的问题（C和C++ 导出符号的问题，即openGauss/MogDB使用C++ 开发，PostgreSQL使用C开发，编译动态库ABI不兼容），所以暂时不能在MogDB上应用，但PostgreSQL的Rust驱动（rust-postgres）则可以在MogDB上正常使用，本文将演示rust-postgres在MogDB上的使用范例。

# 实验环境

- 使用win11自带的WSL，集成Docker Desktop，安装MogDB3.0.0镜像。

```
NAME="Ubuntu" VERSION="20.04.4 LTS (Focal Fossa)" ID=ubuntu ID_LIKE=debian PRETTY_NAME="Ubuntu 20.04.4 LTS" VERSION_ID="20.04" HOME_URL="https://www.ubuntu.com/" SUPPORT_URL="https://help.ubuntu.com/" BUG_REPORT_URL="https://bugs.launchpad.net/ubuntu/" PRIVACY_POLICY_URL="https://www.ubuntu.com/legal/terms-and-policies/privacy-policy" VERSION_CODENAME=focal UBUNTU_CODENAME=focal 
```

- 获取镜像

```
docker pull swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:3.0.0 
```

![image.png](.\figures\rust1.png)

- 启动容器

```
docker run --name mogdb --privileged=true -d -e GS_PASSWORD=Enmo@123 -v C:\mogdb:/var/lib/mogdb -p 15432:5432  swr.cn-north-4.myhuaweicloud.com/mogdb/mogdb:3.0.0 
```

![image.png](.\figures\rust2.png)

![image.png](.\figures\rust3.png)

- 进入容器

```
docker exec -it mogdb bash 
```

![image.png](.\figures\rust4.png)
可参考广泛文档中的“[容器化安装](https://docs.mogdb.io/zh/mogdb/v3.0/docker-installation)”.

# 应用开发

- 新建工程`rust-pg`

```
$ cargo new rust-pg 
```

- 目录结构

```
frank@LAPTOP-4OF1323N:~/project/rust/test$ cd rust-pg/ frank@LAPTOP-4OF1323N:~/project/rust/test/rust-pg$ tree . ├── Cargo.toml └── src    └── main.rs 1 directory, 2 files 
```

- 修改`Cargo.toml` 文件，增加依赖`postgres = "0.19.3"` 。

![image.png](.\figures\rust5.png)

- src/main.rs代码

```
use postgres::{Client, NoTls};

fn main(){
    let mut client = Client::connect("postgresql://frank:frank~123@localhost:15432/postgres", NoTls).unwrap();
    // let mut client = Client::connect("postgresql://frank@localhost/postgres", NoTls).unwrap();

    client.batch_execute("
        CREATE TABLE IF NOT EXISTS person (
            id      SERIAL PRIMARY KEY,
            name    TEXT NOT NULL,
            data    BYTEA
        )
    ").unwrap();

    let name = "Ferris";
    let data = None::<&[u8]>;
    client.execute(
        "INSERT INTO person (name, data) VALUES ($1, $2)",
        &[&name, &data],
    ).unwrap();

    for row in client.query("SELECT id, name, data FROM person", &[]).unwrap() {
        let id: i32 = row.get(0);
        let name: &str = row.get(1);
        let data: Option<&[u8]> = row.get(2);

        println!("found person: {} {} {:?}", id, name, data);
    }

}


复制
```

- 编译crate，使用国内源，列出所有依赖。

```
frank@LAPTOP-4OF1323N:~/project/rust/test/rust-pg$ cargo build
    Updating `tuna` index
  Downloaded postgres-types v0.2.4 (registry `tuna`)
  Downloaded 1 crate (28.1 KB) in 2.14s
   Compiling libc v0.2.132
   Compiling cfg-if v1.0.0
   Compiling autocfg v1.1.0
   Compiling typenum v1.15.0
   Compiling version_check v0.9.4
   Compiling proc-macro2 v1.0.43
   Compiling memchr v2.5.0
   Compiling quote v1.0.21
   Compiling unicode-ident v1.0.3
   Compiling futures-core v0.3.23
   Compiling syn v1.0.99
   Compiling subtle v2.4.1
   Compiling pin-project-lite v0.2.9
   Compiling futures-channel v0.3.23
   Compiling tinyvec_macros v0.1.0
   Compiling futures-sink v0.3.23
   Compiling futures-task v0.3.23
   Compiling log v0.4.17
   Compiling futures-util v0.3.23
   Compiling bytes v1.2.1
   Compiling ppv-lite86 v0.2.16
   Compiling once_cell v1.13.1
   Compiling cpufeatures v0.2.3
   Compiling parking_lot_core v0.9.3
   Compiling unicode-bidi v0.3.8
   Compiling pin-utils v0.1.0
   Compiling futures-io v0.3.23
   Compiling smallvec v1.9.0
   Compiling siphasher v0.3.10
   Compiling byteorder v1.4.3
   Compiling fallible-iterator v0.2.0
   Compiling scopeguard v1.1.0
   Compiling base64 v0.13.0
   Compiling async-trait v0.1.57
   Compiling percent-encoding v2.1.0
   Compiling generic-array v0.14.6
   Compiling slab v0.4.7
   Compiling tokio v1.20.1
   Compiling lock_api v0.4.7
   Compiling tinyvec v1.6.0
   Compiling tracing-core v0.1.29
   Compiling phf_shared v0.10.0
   Compiling phf v0.10.1
   Compiling tracing v0.1.36
   Compiling unicode-normalization v0.1.21
   Compiling getrandom v0.2.7
   Compiling mio v0.8.4
   Compiling socket2 v0.4.4
   Compiling rand_core v0.6.3
   Compiling parking_lot v0.12.1
   Compiling rand_chacha v0.3.1
   Compiling stringprep v0.1.2
   Compiling rand v0.8.5
   Compiling crypto-common v0.1.6
   Compiling block-buffer v0.10.2
   Compiling digest v0.10.3
   Compiling md-5 v0.10.1
   Compiling sha2 v0.10.2
   Compiling hmac v0.12.1
   Compiling postgres-protocol v0.6.4
   Compiling postgres-types v0.2.4
   Compiling tokio-util v0.7.3
   Compiling futures-macro v0.3.23
   Compiling futures-executor v0.3.23
   Compiling futures v0.3.23
   Compiling tokio-postgres v0.7.6
   Compiling postgres v0.19.3
   Compiling rust-pg v0.1.0 (/home/frank/project/rust/test/rust-pg)
    Finished dev [unoptimized + debuginfo] target(s) in 37.67s
```

- 运行

```
cargo run 
```

![image.png](.\figures\rust6.png)

- 验证

![image.png](.\figures\rust7.png)

- 说明

在main.rs代码中，第一行是链接MogDB的范例，第二行是链接PostgreSQL的范例。

```
    let mut client = Client::connect("postgresql://frank:frank~123@localhost:15432/postgres", NoTls).unwrap();
    // let mut client = Client::connect("postgresql://frank@localhost/postgres", NoTls).unwrap();
```

# 尾声

PostgreSQL是扩展性非常强的数据库，甚至可以说没有之一，它几乎兼容了所有主流的开发语言。并且经过多年的沉淀使其积累了很多功能强大的插件。这也为目前基于PostgreSQL的国产数据库提供了改造和扩展空间。尤其是对oracle兼容方面，很大一部分是利用PostgreSQL的扩展性（orafce）进行兼容改造。当然，由于openGauss/MogDB将PostgreSQL改造成C++ ，因此一些插件在迁移时需要进行必要的改动。这需要整个社区的共同努力。