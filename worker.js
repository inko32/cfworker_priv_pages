const GITHUBTOKEN = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const GITHUBREPO = "username/reponame/branch";
// `raw.githubusercontent.com/${GITHUBREPO}`

export default {
  async fetch(request, env, ctx) {
    console.log("initial");
    return filterStatus(request);
  },
};

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

async function handle404(request){
  let resp = await (await judgePath(new Request("http://_/404.html")))[0];
  if(resp.status===200){
    return resp;
  }
  return new Response("",{status:404});
}

async function judgePath(request){
  console.log("[judgepath] enter");
  let path = new URL(request.url).pathname;

  /**@param {Promise<Response>[]} responses */
  let responses=[];
  if(path.endsWith('/')){
    console.log("endswith/");
    responses.push(fetchBranch(new Request("http://_"+path+"index.html")).then(
      resp => {
        if(resp.status == 200){
          let newHdr = {
            "content-type": "text/html"
          };
          return new Response(resp.body,{headers:newHdr, status: resp.status});
        }
      }
    ))
    //responses.push(fetchBranch(new Request("http://_"+path+"index.htm")))
  } else {
    console.log("tryfile");
    responses.push(fetchBranch(new Request("http://_"+path)).then(
      resp => {
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
          'bin': 'application/octet-stream',
         };
        let newHdr = {
          "content-type": (contentTypeMapping[path.slice(path.lastIndexOf(".")+1)]||"text/plain")
        };
         return new Response(resp.body, {
          headers: newHdr, status: resp.status
        });
      }
    )
    
    );
    console.log("foldername with index")
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
  console.log("fetch from: ",url);
  return fetchFromGithub(url);

/**
 * 404 Not Found:
 *    FolderName, File-Non-Exist
 * 400 Invalid Request:
 *    Folder/, Non-Exist/
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
