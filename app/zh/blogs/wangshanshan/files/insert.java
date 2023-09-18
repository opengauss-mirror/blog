//insert.java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.ResultSet;
import java.io.*;

public class insert {

  //创建数据库连接。
  public static Connection GetConnection(String username, String passwd) {
    String driver = "org.postgresql.Driver";
    String sourceURL = "jdbc:postgresql://127.0.0.1:5432/testdb";
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

      ret = stmt.executeUpdate("drop table if exists wss_test.t_m_resource_monitor_test2;");
      ret = stmt.executeUpdate("CREATE TABLE wss_test.t_m_resource_monitor_test2 (\n" +
              "\tid varchar(36) NOT NULL,\n" +
              "\tip varchar(50) NOT NULL DEFAULT '',\n" +
              "\tipv6 varchar(50) NOT NULL DEFAULT '',\n" +
              "\tfull_ipv6 varchar(50) NOT NULL DEFAULT '',\n" +
              "\ttarget_ip varchar(50) NOT NULL DEFAULT '',\n" +
              "\tname varchar(1024) NULL,\n" +
              "\tresource_name varchar(1024) NULL,\n" +
              "\talias varchar(1024) NULL,\n" +
              "\tmodel_id varchar(36) NULL,\n" +
              "\tmodel_name varchar(150) NULL,\n" +
              "\tis_model int4 NOT NULL,\n" +
              "\tgroup_id varchar(36) NULL,\n" +
              "\tgroup_name varchar(150) NULL,\n" +
              "\tconf_group varchar(32) NULL,\n" +
              "\tlogo_id varchar(64) NULL,\n" +
              "\timage_base64 text NULL,\n" +
              "\tmonitor_item int4 NULL,\n" +
              "\tgather_strategy int4 NULL,\n" +
              "\talarm_strategy int4 NULL,\n" +
              "\tstate int4 NULL DEFAULT 0,\n" +
              "\tauto_state int4 NULL DEFAULT 1,\n" +
              "\trelation_state int4 NULL DEFAULT 1,\n" +
              "\tamdb_state varchar(64) NULL,\n" +
              "\tmodifier varchar(64) NULL DEFAULT 'admin'::character varying,\n" +
              "\tmodify_time timestamp(6) NULL,\n" +
              "\tcreater varchar(64) NULL DEFAULT 'admin'::character varying,\n" +
              "\tcreate_time timestamp(6) NULL,\n" +
              "\tdisplay int4 NULL DEFAULT 1,\n" +
              "\tappchecker_state int4 NULL DEFAULT 0,\n" +
              "\tagent_state int4 NULL DEFAULT 0,\n" +
              "\tobserve_state int4 NULL DEFAULT 3,\n" +
              "\tmanual_state int4 NULL DEFAULT -1,\n" +
              "\tagent_process_info varchar(1024) DEFAULT NULL,\n" +
              "\tagent_version varchar(64) DEFAULT NULL,\n" +
              "\tagent_operation_type int4 DEFAULT 0,\n" +
              "\tterminal_state int4 NULL DEFAULT 0,\n" +
              "\treport_state int4 NULL DEFAULT 1,\n" +
              "\tup_time varchar(64) NULL,\n" +
              "\tboot_time timestamp(6) NULL,\n" +
              "\ttenant varchar(2000) NOT NULL DEFAULT '',\n" +
              "\tattr_destroy_time timestamp(6) DEFAULT NULL,\n" +
              "\tattr_agent_id varchar(50) NOT NULL DEFAULT '',\n" +
              "    attr_app_type varchar(32) NOT NULL DEFAULT '',\n" +
              "    attr_parent_system varchar(64) NOT NULL DEFAULT '',\n" +
              "    attr_port varchar(2000) NOT NULL DEFAULT '',\n" +
              "    amdb_update_time timestamp(6) DEFAULT NULL,\n" +
              "    attr_instance_type varchar(32) default '',\n" +
              "\tCONSTRAINT t_m_resource_monitor_pkey_test2 PRIMARY KEY (id));");

      System.out.format("Table created: %d\n", ret);

      ret = stmt.executeUpdate("CREATE INDEX attr_agent_id_index_test2 ON wss_test.t_m_resource_monitor_test2 USING btree (attr_agent_id);");
      ret = stmt.executeUpdate("CREATE INDEX is_model_index_test2 ON wss_test.t_m_resource_monitor_test2 USING btree (is_model);");
      ret = stmt.executeUpdate("CREATE INDEX model_id_index_test2 ON wss_test.t_m_resource_monitor_test2 USING btree (model_id);");
      ret = stmt.executeUpdate("CREATE INDEX model_name_index_test2 ON wss_test.t_m_resource_monitor_test2 USING btree (model_name);");
      ret = stmt.executeUpdate("CREATE INDEX monitor_groupid_targetid_indx_test2 ON wss_test.t_m_resource_monitor_test2 USING btree (group_id);");

      System.out.format("Indexes created: %d\n", ret);

      for (int i = 1; i <= 777; i++) {
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
                "\t('6a0813c6-b4d4-4b9a-b2d6-diff" + i + "',\n" +
                "     '容器_apisix_docker://314b4850be647d3e1342f6aaf643e0b0742d5a0e8a5dd2c902f20a1a6a1c8dfe',\n" +
                "     'apisix',\n" +
                "     '176f7ae1-65eb-4626-82bc-diff" + i + "',\n" +
                "     '容器',\n" +
                "     " + i + ",\n" +
                "     '0bdbae71-9546-4513-988b-diff" + i + "',\n" +
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
                "     ' ');");
      }

      System.out.format("Data loaded: %d\n", ret);

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
              "\t modifier = 'wss_insert',\n" +
              "\t appchecker_state = 0,\n" +
              "\t attr_instance_type = ' ';");

      System.out.format("Row inserted: %d\n", ret);

      ResultSet rs = stmt.executeQuery("select count(*) from wss_test.t_m_resource_monitor_test2");
      while (rs.next()) {
        System.out.format("Row count: %d\n", rs.getInt(1));
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
