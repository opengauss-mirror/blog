---
title: '在openGauss/MogDB中实现months_between函数'

date: '2022-04-11'

category: 'blog'
tags: ['在openGauss/MogDB中实现months_between函数']

archives: '2022-04'

author: '罗海雄'

summary: '在openGauss/MogDB中实现months_between函数'

img: '/zh/blogs/luohaixiong/title/img.png'

times: '10:20'
---

# 在 openGauss/MogDB 中实现 months_between 函数

Oracle 有个函数，months_between, Opengauss 中并没有实现。

## Oracle 实现逻辑

研究一下, Oracle 的实现逻辑如下：
1，提取两个时间的年/月/日数值，年差值\*12 + 月差值作为结果的基础部分。

2，如果正好两个日期都是月末的最后一天，会直接返回上一步的结果。而如果不是，则返回年差值\*12 + 月差值+日差值/31，同时，需要注意的是，日差值部分，包括了时分秒。

在这种特殊的月末的规则下，会出现一些比较奇怪的的现象，特别是在 2 月月底的时候。
举几个例子体会一下：

- months_between(‘20210301’,‘20210228’)返回的值不是大家想象中的 1/31， 而是 4/31.
- months_between(‘20210331’,‘20210228’) 和 months_between(‘20210331’,‘20210228’)都返回 1
- 但 months_between(‘20210330’,‘20210228’)反而会返回 1+2/31, months_between(‘20210329’,‘20210228’)返回 1+1/31.
- months_between(‘20210531’,‘20210430’)
  和 months_between(‘20210530’,‘20210430’) 都返回 1.

## Opengauss(MogDB)实现

知道了规则后，可以通过在 openGauss(MogDB)上创建自定义函数实现兼容。

### 提取年月日

首先，通过 date_part 函数（或者兼容 Oracle 的 extract 函数）取出年月日。下面 t1 代表入参的时间参数。

```
y1 := date_part('year',t1);
m1 := date_part('month',t1);
d1 := date_part('day',t1);
```

或者

```
 y1 := extract(year  from t1);
 m1 := extract(month from t1);
 d1 := extract(day   from t1);
```

值得注意的是，由于 Oracle 函数的返回值里面，是包含了时分秒的时分秒的，因此，这里取出来的 d1/d2 不能直接用结果的返回。需要提取的是包含时分秒信息的日数值，可以通过入参减去月初来实现。

```
 (t1-to_date(to_char(t1,'yyyymm'),'yyyymm'))
```

很遗憾的是，Opengauss 没有实现 trunc(时间列）的功能，否则，下面会是更简便的写法。

```
 t1-trunc(t1,'MM')
```

### 月末判断

这里面有个比较麻烦的是，是闰年的 2 月，需要特殊判断。

#### 不涉及闰年（2 月）的月末判断

最简单的写法，是拼接年和月，然后判断是否在 1/31、3/31、4/30 … 12/31 里面

```
 m1||d1 in ('131','331','430','531','630','731','831','930','1031','1130','1231')
```

这个代码看起来似乎会有那么一丁点的问题，比如说，你也许会想，1 月 11 号和 11 月 1 号拼出来不就一样了吗？但其实没关系，因为 1 月份的日期，我们只关心 1/31, 并不会造成混淆。
当然，如果你很严谨，也可以这样来判断

```
 m1*100 + d1 in (131,331,430,531,630,731,831,930,1031,1130,1231)
```

#### 2 月的月末判断

2 月判断拗口一点，需要了解闰年规则，闰年规则如下：
年能被 4 整除，不能被 100 整除，但被 400 整除又可以。
说起来很拗口，但其实也不复杂

```
 (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0)
```

由于这个是和判断月末一起的，所以，可以连 2 月是否 28 日/29 日一起判断。

```
/*leap year*/
( m1 = 2 and d1=29 and     (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0) )
or /*non-leap year*/
( m1 = 2 and d1=28 and not (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0) )
```

#### 结合 2 月和非 2 月的完整判断

```
    (m1||d1 in ('131','331','430','531','630','731','831','930','1031','1130','1231')
        or /*leap year*/
        ( m1 = 2 and d1=29 and     (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0) )
        or /*non-leap year*/
        ( m1 = 2 and d1=28 and not (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0) )
    )
    and
    (m2||d2 in ('131','331','430','531','630','731','831','930','1031','1130','1231')
        or /*leap year*/
        ( m2 = 2 and d2=29 and     (mod(y2,4)=0 and mod(y2,100)!=0 or mod(y2,400)=0) )
        or /*non-leap year*/
        ( m2 = 2 and d2=28 and not (mod(y2,4)=0 and mod(y2,100)!=0 or mod(y2,400)=0) )
    )

```

## openGauss(MogDB)完整实现

结合前面的逻辑，可以写出最终的代码

```plsql
create or replace function months_between(t1 date ,t2 date)
returns number
-- months_between implementation in MogDB, by LuoHaixiong@Enmotech
as $$
declare
  y1 int;
  y2 int;
  m1 int;
  m2 int;
  d1 int;
  d2 int;
begin
y1 := date_part('year',  t1);
y2 := date_part('year',  t2);
m1 := date_part('month', t1);
m2 := date_part('month', t2);
d1 := date_part('day',   t1);
d2 := date_part('day',   t2);
if --Both dates are end of month
  ( (m1||d1 in ('131','331','430','531','630','731','831','930','1031','1130','1231')
        or /*leap year*/
        ( m1 = 2 and d1=29 and     (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0) )
        or /*non-leap year*/
        ( m1 = 2 and d1=28 and not (mod(y1,4)=0 and mod(y1,100)!=0 or mod(y1,400)=0) )
    )
    and
    (m2||d2 in ('131','331','430','531','630','731','831','930','1031','1130','1231')
        or /*leap year*/
        ( m2 = 2 and d2=29 and     (mod(y2,4)=0 and mod(y2,100)!=0 or mod(y2,400)=0) )
        or /*non-leap year*/
        ( m2 = 2 and d2=28 and not (mod(y2,4)=0 and mod(y2,100)!=0 or mod(y2,400)=0) )
    )
) then
  return (y1-y2)*12+(m1-m2);
else --Normal days
  return (y1-y2)*12+(m1-m2)
          + (
              (t1-to_date(to_char(t1,'yyyymm'),'yyyymm'))
            - (t2-to_date(to_char(t2,'yyyymm'),'yyyymm'))
          )/31;
end if;
end;
$$
LANGUAGE plpgsql;
```
