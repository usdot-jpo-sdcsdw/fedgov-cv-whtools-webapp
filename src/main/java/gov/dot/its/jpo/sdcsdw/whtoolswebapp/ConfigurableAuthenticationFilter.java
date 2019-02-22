package gov.dot.its.jpo.sdcsdw.whtoolswebapp;

import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.jasig.cas.client.authentication.AuthenticationFilter;

import java.io.IOException;

import javax.servlet.Filter;
import javax.servlet.FilterChain;

public class ConfigurableAuthenticationFilter implements Filter
{
    private AuthenticationFilter internal = new AuthenticationFilter();

    @Override
    public void init(FilterConfig filterConfig) throws ServletException
    {
        ConfigurableFilterAdapter.init(internal::init, filterConfig);
    }

    @Override
    public void doFilter(ServletRequest request,
                         ServletResponse response,
                         FilterChain chain) throws IOException, ServletException
    {
        internal.doFilter(request, response, chain);
    }

    @Override
    public void destroy()
    {
        internal.destroy();
    }
    
    
    
}
