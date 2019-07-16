<template>
  <a-card :bordered="false" class="card-area">

    <!-- 查询区域 -->
    <div class="table-page-search-wrapper">
      <!-- 搜索区域 -->
      <a-form layout="inline">
        <a-row :gutter="24">
          <a-col :md="6" :sm="8">
            <a-form-item label="名称" :labelCol="{span: 5}" :wrapperCol="{span: 18, offset: 1}">
              <a-input placeholder="请输入名称查询" v-model="queryParam.roleName"></a-input>
            </a-form-item>
          </a-col>
          <a-col :md="10" :sm="12">
            <a-form-item label="创建时间" :labelCol="{span: 5}" :wrapperCol="{span: 18, offset: 1}">
              <j-date v-model="queryParam.createTime_begin" :showTime="true" date-format="YYYY-MM-DD HH:mm:ss" style="width:45%" placeholder="请选择开始时间" ></j-date>
              <span style="width: 10px;">~</span>
              <j-date v-model="queryParam.createTime_end" :showTime="true" date-format="YYYY-MM-DD HH:mm:ss" style="width:45%" placeholder="请选择结束时间"></j-date>
            </a-form-item>
          </a-col>
          <span style="float: left;overflow: hidden;" class="table-page-search-submitButtons">
            <a-col :md="6" :sm="24">
              <a-button type="primary" @click="searchQuery">查询</a-button>
              <a-button style="margin-left: 8px" @click="searchReset">重置</a-button>
            </a-col>
          </span>
        </a-row>
      </a-form>
    </div>

    <!-- 操作按钮区域 -->
    <div class="table-operator"  style="margin-top: 5px">
      <a-button @click="handleAdd" type="primary" icon="plus">新增</a-button>
      <a-button type="primary" icon="download" @click="handleExportXls('角色信息')">导出</a-button>
      <a-upload name="file" :showUploadList="false" :multiple="false" :headers="tokenHeader" :action="importExcelUrl" @change="handleImportExcel">
        <a-button type="primary" icon="import">导入</a-button>
      </a-upload>

      <a-dropdown v-if="selectedRowKeys.length > 0">
        <a-menu slot="overlay">
          <a-menu-item key="1" @click="batchDel"><a-icon type="delete"/>删除</a-menu-item>
        </a-menu>
        <a-button style="margin-left: 8px">
          批量操作 <a-icon type="down" />
        </a-button>
      </a-dropdown>
    </div>

    <!-- table区域-begin -->
    <div>
      <div class="ant-alert ant-alert-info" style="margin-bottom: 16px;">
        <i class="anticon anticon-info-circle ant-alert-icon"></i> 已选择&nbsp;<a style="font-weight: 600">{{ selectedRowKeys.length }}</a>项&nbsp;&nbsp;
        <a style="margin-left: 24px" @click="onClearSelected">清空</a>
      </div>

      <a-table
        :columns="columns"
        size="middle"
        rowKey="roleUUID"
        :pagination="false"
        :dataSource="dataSource"
        :loading="loading"
        :rowSelection="{selectedRowKeys: selectedRowKeys, onChange: onSelectChange}">

        <span slot="action" slot-scope="text, record">
          <a @click="handleDetail(record)">详情</a>
          <a-divider type="vertical" />
          <a @click="handleEdit(record)">查看用户</a>
          <a-divider type="vertical" />
          <a @click="handleEdit(record)">设置用户</a>
          <a-divider type="vertical" />
          <a @click="handleEdit(record)">查看权限</a>

          <a-divider type="vertical" />

          <a v-if="record.modifyFlag == 0" @click="handlePerssion(record.roleUUID,record.roleCode)">设置权限</a>
          <a-divider type="vertical" v-if="record.modifyFlag == 0"/>
          <a-dropdown v-if="record.modifyFlag == 0">
            <a class="ant-dropdown-link" >
              更多 <a-icon type="down" />
            </a>
            <a-menu slot="overlay">
              <a-menu-item v-if="record.modifyFlag == 0 && record.holdFlag == 0">
                 <a-popconfirm @confirm="() => handleDelete(record.id)" title="确定删除吗?">
                    <a>删除</a>
                </a-popconfirm>
              </a-menu-item>
              <a-menu-item v-if="record.modifyFlag == 0 && record.statusCode=='1'">
                <a @click="handleEdit(record)">禁用</a>
              </a-menu-item>
              <a-menu-item v-if="record.modifyFlag == 0 && record.statusCode=='0'">
                <a @click="handleEdit(record)">启用</a>
              </a-menu-item>
              <a-menu-item v-if="record.odifyFlag == 0">
                <a @click="handleEdit(record)">修改</a>
              </a-menu-item>
              <a-menu-item>
                <a @click="handlePerssion(record.roleUUID)">{record.roleUUID}}</a>
              </a-menu-item>
              <a-menu-item>


              </a-menu-item>
            </a-menu>
          </a-dropdown>
        </span>


      </a-table>
    </div>
    <!-- table区域-end -->

    <!-- 表单区域 -->
    <!--<role-modal ref="modalForm" @ok="modalFormOk"></role-modal>-->
    <user-role-modal ref="modalUserRole"></user-role-modal>
  </a-card>
</template>

<script>
  /*import RoleModal from '../modules/RoleModal'*/
  import UserRoleModal from '../modules/UserRoleModal'
  import {getRoleInfoList} from '@/api/api'
  import { JeecgListMixin } from '@/mixins/JeecgListMixin'
  import JDate from '@/components/jeecg/JDate'
  const  columns = [
    {
      title: '角色名称',
      dataIndex: 'roleName',
      key:'roleName'
    },
    {
      title: '状态',
      dataIndex: 'statusCode',
      key:'statusCode',
      customRender:function (value,row,index) {
        if(value == "1"){
          return  "启用"
        }
        return "禁用"
      }
    },
    {
      title: '操作',
      dataIndex: 'action',
      align:"left",
      scopedSlots: { customRender: 'action' },
    }
  ];
  export default {
    name: "RoleList",
    mixins:[JeecgListMixin],
    components: {
     /* RoleModal,*/
      UserRoleModal,
      JDate
    },
    data () {
      return {
        expandAllKeys:[],
        description: '角色管理页面',
        // 查询条件
        //queryParam: {roleName:'',},
        // 表头
        columnsNames:[],
        columns: columns,
        url: {
          list: "/sys/role/list",
          delete: "/sys/role/delete",
          deleteBatch: "/sys/role/deleteBatch",
        },
      }
    },
    computed: {
      importExcelUrl: function(){
       /* return `${window._CONFIG['domianURL']}/${this.url.importExcelUrl}`;*/
      }
    },
    methods: {
      loadData(){
        this.dataSource = []
        getRoleInfoList().then((res) => {
          if (res.success) {
            console.log(res.result)
            this.dataSource = res.result.treeData
            this.expandAllKeys = res.result.ids;
          }
        })
      },
      handlePerssion: function(roleId,roleCode){
        // alert(roleId);
        this.$refs.modalUserRole.show(roleId,roleCode);
      },
      onChangeDate(date, dateString) {
        console.log(date, dateString);
      },
    }
  }
</script>
<style scoped>
  @import '~@assets/less/common.less'
</style>