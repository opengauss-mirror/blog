//update.java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.ResultSet;
import java.io.*; 

public class update_dup {

  //创建数据库连接。
  public static Connection GetConnection(String username, String passwd) {
    String driver = "org.postgresql.Driver";
    String sourceURL = "jdbc:postgresql://***.***.***.***:5432/testdb";
    Connection conn = null;
    try {
      //加载数据库驱动。
      Class.forName(driver).newInstance();
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }
    try {
      //创建数据库连接。
      conn = DriverManager.getConnection(sourceURL, username, passwd);
      System.out.println("Connection succeed!");
    } catch (Exception e) {
      e.printStackTrace();
      return null;
    }
    return conn;
  }

  //执行普通SQL语句，查询测试表。
  public static void QueryTable(Connection conn) {
    Statement stmt = null;
    try {
      stmt = conn.createStatement();
      //执行普通SQL语句。
      stmt.setFetchSize(50);

      int ret = 0;

      for (int i = 1; i <= 777; i++){
        ret = stmt.executeUpdate("insert into wss_test.t_m_resource_monitor_test2\n" +
                "\t(id,\n" +
                "     name,\n" +
                "     resource_name,\n" +
                "     model_id,\n" +
                "     model_name,\n" +
                "     is_model,\n" +
                "     group_id,\n" +
                "     group_name,\n" +
                "     conf_group,\n" +
                "     logo_id,\n" +
                "     image_base64,\n" +
                "     ip,\n" +
                "     ipv6,\n" +
                "     full_ipv6,\n" +
                "     target_ip,\n" +
                "     state,\n" +
                "     amdb_state,\n" +
                "     monitor_item,\n" +
                "     gather_strategy,\n" +
                "     alarm_strategy,\n" +
                "     tenant,\n" +
                "     attr_destroy_time,\n" +
                "     attr_agent_id,\n" +
                "     attr_app_type,\n" +
                "     attr_parent_system,\n" +
                "     attr_port,\n" +
                "     amdb_update_time,\n" +
                "     modify_time,\n" +
                "     create_time,\n" +
                "     appchecker_state,\n" +
                "     attr_instance_type) \n" +
                "\tvalues\n" +
                "\t('6a0813c6-b4d4-4b9a-b2d6-5f3c1d23a646',\n" +
                "     '容器_apisix_docker://314b4850be647d3e1342f6aaf643e0b0742d5a0e8a5dd2c902f20a1a6a1c8dfe',\n" +
                "     'apisix',\n" +
                "     '176f7ae1-65eb-4626-82bc-687c1cd112d1',\n" +
                "     '容器',\n" +
                "     0,\n" +
                "     '0bdbae71-9546-4513-988b-d1d2f920065c',\n" +
                "     'Kubernetes',\n" +
                "     '默认配置组',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     1,\n" +
                "     '下线',\n" +
                "     0,\n" +
                "     0,\n" +
                "     0,\n" +
                "     '平台运营租户',\n" +
                "     '2023-06-30 19:59:10',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     ' ',\n" +
                "     '2023-06-30 19:59:14',\n" +
                "     '2023-06-30 20:05:00.292',\n" +
                "     '2023-06-30 19:59:14',\n" +
                "     0,\n" +
                "     ' ')\n" +
                "\tON DUPLICATE KEY UPDATE\n" +
                "\t name = '容器_apisix_docker://314b4850be647d3e1342f6aaf643e0b0742d5a0e8a5dd2c902f20a1a6a1c8dfe',\n" +
                "\t resource_name = 'apisix',\n" +
                "\t model_id = '176f7ae1-65eb-4626-82bc-687c1cd112d1',\n" +
                "\t model_name = '容器',\n" +
                "\t is_model = 0,\n" +
                "\t group_id = '0bdbae71-9546-4513-988b-d1d2f920065c',\n" +
                "\t group_name = 'Kubernetes',\n" +
                "\t conf_group = '默认配置组',\n" +
                "\t logo_id = ' ',\n" +
                "\t image_base64 = ' ',\n" +
                "\t ip = ' ',\n" +
                "\t ipv6 = ' ',\n" +
                "\t full_ipv6 = ' ',\n" +
                "\t target_ip = ' ',\n" +
                "\t amdb_state = '下线',\n" +
                "\t tenant = '平台运营租户',\n" +
                "\t attr_destroy_time = '2023-06-30 19:59:10',\n" +
                "\t attr_agent_id = ' ',\n" +
                "\t attr_app_type = ' ',\n" +
                "\t attr_parent_system = ' ',\n" +
                "\t attr_port = ' ',\n" +
                "\t amdb_update_time = '2023-06-30 19:59:14',\n" +
                "\t modify_time = '2023-06-30 20:05:00.292',\n" +
                "\t modifier = 'wss_update-dup" + i + "',\n" +
                "\t appchecker_state = 0,\n" +
                "\t attr_instance_type = ' ';");

        ResultSet rs = stmt.executeQuery("select xmin, xmax, modifier from wss_test.t_m_resource_monitor_test2 where id = '6a0813c6-b4d4-4b9a-b2d6-5f3c1d23a646'");
        while (rs.next())
        {
          System.out.format("xmin=%d, xmax=%d, modifier=%s\n", rs.getInt(1), rs.getInt(2), rs.getString(3));
        }
      }

      System.out.format("Row updated with dup: %d\n", ret);

      ResultSet rs = stmt.executeQuery("select count(*) from wss_test.t_m_resource_monitor_test2");
      while (rs.next())
      {
        System.out.format("Count: %d\n", rs.getInt(1));
      }

      rs.close();
      stmt.close();
    } catch (SQLException e) {
      if (stmt != null) {
        try {
          stmt.close();
        } catch (SQLException e1) {
          e1.printStackTrace();
        }
      }
      e.printStackTrace();
    }
  }

  public static void main(String[] args) {
    //创建数据库连接。
    Connection conn = GetConnection("testusr", "Test@123");
    //查询表。
    QueryTable(conn);
    //关闭数据库连接。
    try {
      conn.close();
    } catch (SQLException e) {
        e.printStackTrace();
    }
  }
}
