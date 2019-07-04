import Vue from 'vue'
import { login, logout } from "@/api/login"
import { ACCESS_TOKEN, USER_NAME,USER_INFO,USER_AUTH,SYS_BUTTON_AUTH } from "@/store/mutation-types"
import { welcome,myReplace} from "@/utils/util"
import { queryPermissionsByUser } from '@/api/api'

const user = {
  state: {
    token: '',
    username: '',
    realname: '',
    welcome: '',
    avatar: '',
    permissionList: [],
    info: {}
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token
    },
    SET_NAME: (state, { username, realname, welcome }) => {
      state.username = username
      state.realname = realname
      state.welcome = welcome
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_PERMISSIONLIST: (state, permissionList) => {
      state.permissionList = permissionList
    },
    SET_INFO: (state, info) => {
      state.info = info
    },
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        login(userInfo).then(response => {
            if(response.code =='200'){
            const result = response.result
            const userInfo = result.userInfo
            Vue.ls.set(ACCESS_TOKEN, result.token, 7 * 24 * 60 * 60 * 1000)
            Vue.ls.set(USER_NAME, userInfo.username, 7 * 24 * 60 * 60 * 1000)
            Vue.ls.set(USER_INFO, userInfo, 7 * 24 * 60 * 60 * 1000)
            commit('SET_TOKEN', result.token)
            commit('SET_INFO', userInfo)
            commit('SET_NAME', { username: userInfo.username,realname: userInfo.realname, welcome: welcome() })
            commit('SET_AVATAR', userInfo.avatar)
            resolve(response)
          }else{
            reject(response)
          }
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 获取用户信息
    GetPermissionList({ commit }) {
      return new Promise((resolve, reject) => {
        let v_token = Vue.ls.get(ACCESS_TOKEN);
        let params = {token:v_token};
        queryPermissionsByUser(params).then(response => {
          const menuData = response.result.menu;
          const authData = response.result.auth;
          const allAuthData = response.result.allAuth;
          //Vue.ls.set(USER_AUTH,authData);
          sessionStorage.setItem(USER_AUTH,JSON.stringify(authData));
          sessionStorage.setItem(SYS_BUTTON_AUTH,JSON.stringify(allAuthData));
          let newMenu =  makeRoutesSafe(menuData)
          if (menuData && menuData.length > 0) {
            commit('SET_PERMISSIONLIST', newMenu);
          } else {
            reject('getPermissionList: permissions must be a non-null array !')
          }
          response.result.menu = newMenu;
          resolve(response)
        }).catch(error => {
          reject(error)
        })
      })
    },

    // 登出
    Logout({ commit, state }) {
      return new Promise((resolve) => {
        let logoutToken = state.token;
        commit('SET_TOKEN', '')
        commit('SET_PERMISSIONLIST', [])
        Vue.ls.remove(ACCESS_TOKEN)
        //console.log('logoutToken: '+ logoutToken)
        logout(logoutToken).then(() => {
          resolve()
        }).catch(() => {
          resolve()
        })
      })
    },

  }
}

//组装
const makeRoutesSafe = (routes) => {
  routes =   transition(setting,routes)
  let newRouter = [];
  newRouter.push(
    {
      component:"dashboard/Analysis",
      id: "9502685863ab87f0ad1134142788a385",
      meta:{
        title:"首页",
        keepAlive:true,
        icon:"home"
      },
      name:"dashboard-analysis",
      path:"/dashboard/analysis",
      redirect:null,
      route:1
    }
  );

  var reg=new RegExp("_","g");
  for (var index = 0;index< routes.length; index++) {
    var route = routes[index]
    if(route.children){
      route.meta = { title: route.menuName, icon: 'home',keepAlive:true}
      route.component = 'layouts/RouteView'

    }else{
        route.meta = { title: route.menuName ,keepAlive:`true`}

      const componentPath = route.menuCode.replace(reg,"/")

      route.component =componentPath
    }
    route.path = "/"+route.menuCode.replace(reg,"/")
    route.redirect= null
    route.id = route.menuCode
    route.route = 1
    route.name = route.menuCode
    if (route.children) {
      makeRoutesSafe(route.children)
    }
    newRouter.push(route)
  }

  return newRouter
}

//菜单组装格式
var setting = {
  data: {
    simpleData: {
      idKey: "menuCode",
      pIdKey: "parentCode",
      enable: true
    },
    key: {
      children: "children"
    }
  }
};

function transition(setting, sNodes) {
  var i, l,
    key = setting.data.simpleData.idKey,
    parentKey = setting.data.simpleData.pIdKey,
    childKey = setting.data.key.children;
  if(!key || key == "" || !sNodes) return [];
  var r = [];
  var tmpMap = {};
  for(i = 0, l = sNodes.length; i < l; i++) {
    tmpMap[sNodes[i][key]] = sNodes[i];
  };
  for(i = 0, l = sNodes.length; i < l; i++) {
    if(tmpMap[sNodes[i][parentKey]] && sNodes[i][key] != sNodes[i][parentKey]) {
      if(!tmpMap[sNodes[i][parentKey]][childKey])
        tmpMap[sNodes[i][parentKey]][childKey] = [];
      tmpMap[sNodes[i][parentKey]][childKey].push(sNodes[i]);
    } else {
      r.push(sNodes[i]);
    };
  };
  return r;
};

export default user