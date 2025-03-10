const GITHUBTOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const GITHUBREPO = "username/reponame/branch";
// `raw.githubusercontent.com/${GITHUBREPO}`

export default {
  async fetch(request, env, ctx) {
    console.log("initial");
    return filterStatus(request);
  },
};
/**
 * Returns response if file exists ( http 200 )
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function filterStatus(request){

  let notfound = new Response("",{status:404});

  let responses = await judgePath(request);
  console.log(responses);
  for (let resp of responses.values()) {
    /**@param {Response} aresp */
    let aresp = (await resp)||notfound;
    if(aresp.status === 200 ||aresp.status === 302) {
      console.log(200);
      return aresp;
    }
  }
  return handle404(request);// not found
}

/**
 * Returns 404.html or 404
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function handle404(request){
  let resp = await (await judgePath(new Request("http://_/404.html")))[0];
  if(resp.status===200){
    return new Response(resp.body, {
      headers: resp.headers,
      status: 404
    });
  }
  return new Response("",{status:404});
}

/**
 * Returns 1-2 Response(s) for filterStatus
 * @param {Request} request 
 * @returns {Promise<Promise<Response>[]>}
 */
async function judgePath(request){
  console.log("[judgepath] enter");
  let path = new URL(request.url).pathname;

  /**@param {Promise<Response>[]} responses */
  let responses=[];
  if(path.endsWith('/')){
      console.log("endswith/, add index.html");
    path+="index.html";
  }
  console.log("tryfile");
  responses.push(fetchBranch(new Request("http://_"+path)).then(
    resp => {
      function makeContentType(hdr){
        let old = hdr.get("content-type");
        let postfix = (old && old.includes(";"))?(old.slice(old.lastIndexOf(";"))):"";
        const contentTypeMapping = {
          'html': 'text/html', 
          'css': 'text/css',
          'js': 'application/javascript', 
          'json': 'application/json',
          'png': 'image/png', 
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg', 
          'gif': 'image/gif',
          'txt': 'text/plain', 
          'ico': 'image/x-icon',
          'bin': 'application/octet-stream',
          };

        if(!old)
          return (contentTypeMapping[path.slice(path.lastIndexOf(".")+1)]||"text/plain");
        if(old.includes("text/plain"))
          return (contentTypeMapping[path.slice(path.lastIndexOf(".")+1)]||"text/plain")+postfix;
        if(old.includes("application/octet-stream"))
          return (contentTypeMapping[path.slice(path.lastIndexOf(".")+1)]||old);
        return old;
      }

        return new Response(resp.body, {
        headers: { // newHdr
          "content-type": makeContentType(resp.headers)
        }, status: resp.status
      });
    }
  )
  
  );
  if(!path.endsWith("/index.html")){
    console.log("try foldername with index, return 302 if exists")
    responses.push(fetchBranch(new Request("http://_"+path+"/index.html")).then(
        resp => {
          if(resp.status == 200){
            return Response.redirect(request.url+'/',302);
          }
        }
      )
    )
  }
  return responses;
}

/**
 * fetch from selected branch
 * @param {Request} request 
 * @returns {Promise<Response>}
 */
async function fetchBranch(request){
  let url = request.url
    .replace( new URL(request.url).hostname, 
      `raw.githubusercontent.com/${GITHUBREPO}`);
  // not a proper way for processing url
  console.log("fetch from: ",url);
  return fetchFromGithub(url);

/**
 * 404 Not Found:
 *    FolderName, File-Non-Exist
 * 400 Invalid Request:
 *    Folder/, Non-Exist/
 * 200:
 *    File-Exist
 * 
 * Not sure:
 *    Folder-Exist//File-Exist ( multiple / may cause 302 from github )
 */
}

/**
 * Access to private repo
 * @param {string} url
 * @return {Promise<Response>}
 */
async function fetchFromGithub (url){
  return fetch(new Request(url,
    {
      headers: {
        "Authorization": `Bearer ${GITHUBTOKEN}`
      }
    }
  ));
}
